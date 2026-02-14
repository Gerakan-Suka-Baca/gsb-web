
import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type { Question, TryoutAttempt } from "@/payload-types";

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

      const updateData: Partial<TryoutAttempt> = { 
        answers: input.answers, 
        flags: input.flags,
      };
      if (input.currentSubtest !== undefined) updateData.currentSubtest = input.currentSubtest;
      if (input.examState !== undefined) updateData.examState = input.examState;
      if (input.bridgingExpiry !== undefined) updateData.bridgingExpiry = input.bridgingExpiry;
      if (input.secondsRemaining !== undefined) updateData.secondsRemaining = input.secondsRemaining;

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: updateData,
      });
      return { success: true };
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

      const subtests = (tryout.questions as Question[]) || [];
      let totalQuestions = 0;
      let correctCount = 0;

      interface QuestionResult {
        subtestId: string;
        subtestTitle: string;
        subtestType: string;
        questionId: string;
        questionNumber: number;
        selectedAnswerId: string | null;
        selectedLetter: string | null;
        correctAnswerId: string | null;
        correctLetter: string | null;
        isCorrect: boolean;
      }

      const questionResults: QuestionResult[] = [];

      for (const subtest of subtests) {
        const subtestAnswers = input.answers[subtest.id] || {};
        const questions = subtest.tryoutQuestions || [];

        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          const qID = q.id || `q-${qIdx}`;
          totalQuestions++;

          const selectedAnswerId = subtestAnswers[qID] || null;
          const answers = q.tryoutAnswers || [];

          // Find correct answer
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
            subtestTitle: subtest.title,
            subtestType: subtest.subtest,
            questionId: qID,
            questionNumber: qIdx + 1,
            selectedAnswerId,
            selectedLetter,
            correctAnswerId,
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
