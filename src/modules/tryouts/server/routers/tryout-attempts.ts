
import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type { Question } from "@/payload-types";
import { TryoutAttempt } from "../../types";
import {
  MAX_PROCESSED_BATCHES,
  getTryoutId,
  calculateSubmissionResults,
  validateTryoutAttempt,
} from "../../utils/tryout-utils";

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
        sort: "-createdAt", // Ensure we get the latest attempt
        depth: 0,
      });
      return (attempts.docs.length === 0
        ? null
        : attempts.docs[0]) as unknown as TryoutAttempt | null;
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
        sort: "-createdAt",
        depth: 0,
      });

      // If there is an existing attempt (latest)
      if (existing.docs.length > 0) {
        const attempt = existing.docs[0] as unknown as TryoutAttempt;
        
        // If it's still running, RESUME it
        if (attempt.status !== "completed") {
          return attempt;
        }

        // If it's completed, check if it was a valid attempt (has answers)
        // If it has answers, we DO NOT allow retakes -> Return it (Frontend will redirect to result)
        const hasAnswers = attempt.answers && Object.keys(attempt.answers).length > 0;
        if (hasAnswers) {
          return attempt;
        }

        // If it's completed but has NO answers (likely a system error/ghost attempt),
        // we allow creating a NEW attempt to "fix" the user's state.
      }

      // Create a NEW attempt (First time OR fixing a ghost attempt)
      const newAttempt = await payload.create({
        collection: "tryout-attempts",
        data: {
          user: session.user.id,
          tryout: input.tryoutId,
          status: "started",
          answers: {},
          flags: {},
          startedAt: new Date().toISOString(),
          currentSubtest: 0,
          currentQuestionIndex: 0,
          examState: "running",
          secondsRemaining: null, // Let client calculate based on subtest duration
        },
      });
      return newAttempt as unknown as TryoutAttempt;
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
      const attemptRaw = (await payload.findByID({
        collection: "tryout-attempts",
        id: input.attemptId,
      })) as unknown as TryoutAttempt;

      validateTryoutAttempt(attemptRaw, session.user.id);

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          answers: input.answers,
          flags: input.flags,
          ...(input.currentSubtest !== undefined && {
            currentSubtest: input.currentSubtest,
          }),
          ...(input.examState !== undefined && { examState: input.examState }),
          ...(input.bridgingExpiry !== undefined && {
            bridgingExpiry: input.bridgingExpiry,
          }),
          ...(input.secondsRemaining !== undefined && {
            secondsRemaining: input.secondsRemaining,
          }),
          ...(input.currentQuestionIndex !== undefined && {
            currentQuestionIndex: input.currentQuestionIndex,
          }),
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
      const attemptRaw = (await payload.findByID({
        collection: "tryout-attempts",
        id: input.attemptId,
      })) as unknown as TryoutAttempt;

      const attempt = validateTryoutAttempt(attemptRaw, session.user.id);

      const processed = Array.isArray(attempt.processedBatchIds)
        ? attempt.processedBatchIds
        : [];

      if (processed.includes(input.batchId)) {
        return { success: true, duplicate: true };
      }

      // Ensure answers and flags are objects
      const nextAnswers = { ...attempt.answers };
      const nextFlags = { ...attempt.flags };

      const ordered = [...input.events].sort(
        (a, b) => a.clientTs - b.clientTs || a.revision - b.revision
      );
      for (const event of ordered) {
        if (event.kind === "answer") {
          const sub = nextAnswers[event.subtestId]
            ? { ...nextAnswers[event.subtestId] }
            : {};
          if (event.answerId !== undefined) {
            sub[event.questionId] = event.answerId;
          }
          nextAnswers[event.subtestId] = sub;
        } else {
          const sub = nextFlags[event.subtestId]
            ? { ...nextFlags[event.subtestId] }
            : {};
          sub[event.questionId] = Boolean(event.flag);
          nextFlags[event.subtestId] = sub;
        }
      }

      const nextProcessed = [
        ...processed.filter((id) => id !== input.batchId),
        input.batchId,
      ].slice(-MAX_PROCESSED_BATCHES);

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          answers: nextAnswers,
          flags: nextFlags,
          processedBatchIds: nextProcessed,
          ...(input.currentSubtest !== undefined && {
            currentSubtest: input.currentSubtest,
          }),
          ...(input.examState !== undefined && { examState: input.examState }),
          ...(input.secondsRemaining !== undefined && {
            secondsRemaining: input.secondsRemaining,
          }),
          ...(input.currentQuestionIndex !== undefined && {
            currentQuestionIndex: input.currentQuestionIndex,
          }),
        },
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
      const attemptRaw = (await payload.findByID({
        collection: "tryout-attempts",
        id: input.attemptId,
      })) as unknown as TryoutAttempt;

      const attempt = validateTryoutAttempt(attemptRaw, session.user.id, {
        allowCompleted: true,
      });

      if (attempt.status === "completed") return attempt;

      // Fetch the tryout with questions populated
      const tryoutId = getTryoutId(attempt.tryout);
      const tryout = await payload.findByID({
        collection: "tryouts",
        id: tryoutId,
        depth: 2,
      });

      const tryoutRecord = tryout as unknown as Record<string, unknown>;
      const subtests = Array.isArray(tryoutRecord.questions)
        ? (tryoutRecord.questions as Question[])
        : [];

      if (!Array.isArray(subtests)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tryout data invalid: questions not populated",
        });
      }

      // Calculate results (counts, basic correctness) - externalized logic
      const results = calculateSubmissionResults(subtests, input.answers);

      const updated = await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          status: "completed",
          completedAt: new Date().toISOString(),
          answers: input.answers,
          score: results.score,
          correctAnswersCount: results.correctCount,
          totalQuestionsCount: results.totalQuestions,
          questionResults: results.questionResults,
        },
      });

      return updated as unknown as TryoutAttempt;
    }),

  getMyAttempts: protectedProcedure.query(async ({ ctx }) => {
    const { db: payload, session } = ctx;
    const attempts = await payload.find({
      collection: "tryout-attempts",
      where: { user: { equals: session.user.id } },
      depth: 1,
      pagination: false,
      sort: "-createdAt",
    });
    return attempts.docs as unknown as TryoutAttempt[];
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

      const attemptRaw = (await payload.findByID({
        collection: "tryout-attempts",
        id: input.attemptId,
      })) as unknown as TryoutAttempt;

      validateTryoutAttempt(attemptRaw, session.user.id, {
        allowCompleted: true,
      });

      const updated = await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: { resultPlan: input.plan },
      });

      return updated as unknown as TryoutAttempt;
    }),
});
