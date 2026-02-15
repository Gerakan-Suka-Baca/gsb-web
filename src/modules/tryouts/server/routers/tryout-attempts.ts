
import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type { Question } from "@/payload-types";

const eventSchema = z.object({
  id: z.string(),
  kind: z.enum(["answer", "flag"]),
  subtestId: z.string(),
  questionId: z.string(),
  answerId: z.string().optional(),
  flag: z.boolean().optional(),
  revision: z.number(),
  clientTs: z.number(),
});

export const tryoutAttemptsRouter = createTRPCRouter({
  getAttempt: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;
      const attempts = await payload.find({
        collection: "tryout-attempts",
        where: {
          and: [
            { user: { equals: session.user.id } },
            { tryout: { equals: input.tryoutId } },
          ],
        },
        limit: 1,
        depth: 0,
      });
      return attempts.docs.length === 0 ? null : attempts.docs[0];
    }),

  startAttempt: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;

      const existing = await payload.find({
        collection: "tryout-attempts",
        where: {
          and: [
            { user: { equals: session.user.id } },
            { tryout: { equals: input.tryoutId } },
          ],
        },
        limit: 1,
      });

      if (existing.docs.length > 0) return existing.docs[0];

      return payload.create({
        collection: "tryout-attempts",
        data: {
          user: session.user.id,
          tryout: input.tryoutId,
          status: "started",
          answers: {},
          flags: {},
          startedAt: new Date().toISOString(),
          currentSubtest: 0,
          examState: "running",
        },
      });
    }),

  saveProgress: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        answers: z.record(z.string(), z.record(z.string(), z.string())),
        flags: z.record(z.string(), z.record(z.string(), z.boolean())),
        currentSubtest: z.number().optional(),
        examState: z.enum(["running", "bridging"]).optional(),
        bridgingExpiry: z.string().optional(),
        secondsRemaining: z.number().optional(),
        currentQuestionIndex: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;
      const attempt = await payload.findByID({ collection: "tryout-attempts", id: input.attemptId });

      if (!attempt || (typeof attempt.user === "object" ? attempt.user.id : attempt.user) !== session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (attempt.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tryout already completed" });
      }

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          answers: input.answers,
          flags: input.flags,
          ...(input.currentSubtest !== undefined && { currentSubtest: input.currentSubtest }),
          ...(input.examState !== undefined && { examState: input.examState }),
          ...(input.bridgingExpiry !== undefined && { bridgingExpiry: input.bridgingExpiry }),
          ...(input.secondsRemaining !== undefined && { secondsRemaining: input.secondsRemaining }),
          ...(input.currentQuestionIndex !== undefined && { currentQuestionIndex: input.currentQuestionIndex }),
        },
      });
      return { success: true };
    }),

  saveProgressBatch: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        batchId: z.string(),
        clientTime: z.number(),
        events: z.array(eventSchema),
        currentSubtest: z.number().optional(),
        examState: z.enum(["running", "bridging"]).optional(),
        secondsRemaining: z.number().optional(),
        currentQuestionIndex: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;
      const attempt = await payload.findByID({ collection: "tryout-attempts", id: input.attemptId });

      if (!attempt || (typeof attempt.user === "object" ? attempt.user.id : attempt.user) !== session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (attempt.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tryout already completed" });
      }

      const attemptRecord = attempt as unknown as Record<string, unknown>;
      const processed = Array.isArray(attemptRecord.processedBatchIds)
        ? (attemptRecord.processedBatchIds as string[])
        : [];

      if (processed.includes(input.batchId)) {
        return { success: true, duplicate: true };
      }

      const nextAnswers = (typeof attempt.answers === "object" && attempt.answers ? { ...(attempt.answers as Record<string, Record<string, string>>) } : {}) as Record<string, Record<string, string>>;
      const nextFlags = (typeof attempt.flags === "object" && attempt.flags ? { ...(attempt.flags as Record<string, Record<string, boolean>>) } : {}) as Record<string, Record<string, boolean>>;

      const ordered = [...input.events].sort((a, b) => a.clientTs - b.clientTs || a.revision - b.revision);
      for (const event of ordered) {
        if (event.kind === "answer") {
          const sub = nextAnswers[event.subtestId] ? { ...nextAnswers[event.subtestId] } : {};
          if (event.answerId !== undefined) {
            sub[event.questionId] = event.answerId;
          }
          nextAnswers[event.subtestId] = sub;
        } else {
          const sub = nextFlags[event.subtestId] ? { ...nextFlags[event.subtestId] } : {};
          sub[event.questionId] = Boolean(event.flag);
          nextFlags[event.subtestId] = sub;
        }
      }

      const nextProcessed = [...processed.filter((id) => id !== input.batchId), input.batchId].slice(-100);

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          answers: nextAnswers,
          flags: nextFlags,
          processedBatchIds: nextProcessed,
          ...(input.currentSubtest !== undefined && { currentSubtest: input.currentSubtest }),
          ...(input.examState !== undefined && { examState: input.examState }),
          ...(input.secondsRemaining !== undefined && { secondsRemaining: input.secondsRemaining }),
          ...(input.currentQuestionIndex !== undefined && { currentQuestionIndex: input.currentQuestionIndex }),
        } as Record<string, unknown>,
      });

      return { success: true, applied: ordered.length };
    }),

  submitAttempt: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        answers: z.record(z.string(), z.record(z.string(), z.string())),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;
      const attempt = await payload.findByID({ collection: "tryout-attempts", id: input.attemptId });

      if (!attempt || (typeof attempt.user === "object" ? attempt.user.id : attempt.user) !== session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (attempt.status === "completed") return attempt;

      // Fetch the tryout with questions populated
      const tryoutId = typeof attempt.tryout === "object" ? attempt.tryout.id : attempt.tryout;
      const tryout = await payload.findByID({
        collection: "tryouts",
        id: tryoutId,
        depth: 2,
      });

      const tryoutRecord = tryout as unknown as Record<string, unknown>;
      const subtests = Array.isArray(tryoutRecord.questions) ? (tryoutRecord.questions as Question[]) : [];
      if (!Array.isArray(subtests)) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Tryout data invalid: questions not populated" });
      }

      let totalQuestions = 0;
      let correctCount = 0;

      // Lean result structure — only essential data per question
      const questionResults: {
        subtestId: string;
        questionId: string;
        questionNumber: number;
        selectedLetter: string | null;
        correctLetter: string | null;
        isCorrect: boolean;
      }[] = [];

      for (const subtest of subtests) {
        if (typeof subtest !== 'object') continue;

        const subtestAnswers = input.answers[subtest.id] || {};
        const questions = subtest.tryoutQuestions || [];

        if (!Array.isArray(questions)) continue;

        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          const qID = q.id || `q-${qIdx}`;
          totalQuestions++;

          const selectedAnswerId = subtestAnswers[qID] || null;
          const answers = q.tryoutAnswers || [];

          // Find correct answer letter
          let correctAnswerId: string | null = null;
          let correctLetter: string | null = null;
          for (let aIdx = 0; aIdx < answers.length; aIdx++) {
            if (answers[aIdx].isCorrect) {
              correctAnswerId = answers[aIdx].id || null;
              correctLetter = String.fromCharCode(65 + aIdx);
              break;
            }
          }

          // Find selected letter
          let selectedLetter: string | null = null;
          if (selectedAnswerId) {
            const selectedIdx = answers.findIndex((a) => a.id === selectedAnswerId);
            if (selectedIdx >= 0) selectedLetter = String.fromCharCode(65 + selectedIdx);
          }

          const isCorrect = selectedAnswerId !== null && selectedAnswerId === correctAnswerId;
          if (isCorrect) correctCount++;

          questionResults.push({
            subtestId: subtest.id,
            questionId: qID,
            questionNumber: qIdx + 1,
            selectedLetter,
            correctLetter,
            isCorrect,
          });
        }
      }

      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const updated = await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          status: "completed",
          completedAt: new Date().toISOString(),
          answers: input.answers,
          score,
          correctAnswersCount: correctCount,
          totalQuestionsCount: totalQuestions,
          questionResults,
        },
      });

      return updated;
    }),

  getMyAttempts: protectedProcedure
    .query(async ({ ctx }) => {
      const { db: payload, session } = ctx;
      const attempts = await payload.find({
        collection: "tryout-attempts",
        where: { user: { equals: session.user.id } },
        depth: 1,
        pagination: false,
        sort: "-createdAt",
      });
      return attempts.docs;
    }),

  updatePlan: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        plan: z.enum(["free", "paid"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;

      const attempt = await payload.findByID({
        collection: "tryout-attempts",
        id: input.attemptId,
      });

      if (!attempt) throw new Error("Attempt not found");

      const attemptUserId = typeof attempt.user === "object" ? attempt.user.id : attempt.user;
      if (attemptUserId !== session.user.id) throw new Error("Unauthorized");

      const updated = await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: { resultPlan: input.plan },
      });

      return updated;
    }),
});
