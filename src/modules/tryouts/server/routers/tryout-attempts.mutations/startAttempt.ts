import z from "zod";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/trpc/init";
import { getTryoutId } from "@/modules/tryouts/utils/tryout-utils";
import {
  assertTryoutWindowOpen,
  getTryoutWindow,
} from "@/modules/tryouts/server/helpers/tryout-window.helpers";
import {
  getAttemptSubtestIndex,
  getRetakeSubtestIndex,
} from "@/modules/tryouts/server/helpers/tryout-attempt-index.helpers";
import {
  buildRetakeTimerWindow,
  buildServerTimerWindow,
} from "@/modules/tryouts/server/helpers/tryout-timer.helpers";

import type { PayloadLike } from "@/modules/tryouts/server/helpers/tryout-window.helpers";
import type { TryoutAttempt } from "@/modules/tryouts/types";

const hasNestedEntries = (
  value: Record<string, Record<string, unknown>> | null | undefined
) =>
  Object.values(value ?? {}).some(
    (inner) => typeof inner === "object" && inner !== null && Object.keys(inner).length > 0
  );

export const startAttempt = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { db: payload, session } = ctx;
    const now = new Date();
    const nowIso = now.toISOString();
    const tryoutWindow = await getTryoutWindow(payload as PayloadLike, input.tryoutId);

    // Find existing attempt BEFORE checking window — allow resume even after close
    const existing = await payload.find({
      collection: "tryout-attempts",
      where: {
        and: [{ user: { equals: session.user.id } }, { tryout: { equals: input.tryoutId } }],
      },
      limit: 1,
      sort: "-createdAt",
      depth: 0,
    });

    if (existing.docs.length > 0) {
      const attempt = existing.docs[0] as unknown as TryoutAttempt;
      if (attempt.status !== "completed") {
        const shouldForceReset =
          getAttemptSubtestIndex(attempt) === 0 &&
          !hasNestedEntries(attempt.answers as Record<string, Record<string, unknown>> | undefined) &&
          !hasNestedEntries(attempt.flags as Record<string, Record<string, unknown>> | undefined) &&
          typeof attempt.subtestDeadlineAt === "string" &&
          Date.parse(attempt.subtestDeadlineAt) <= now.getTime();
        const resumedTimer = await buildServerTimerWindow({
          payload: payload as PayloadLike,
          attempt,
          tryoutId: getTryoutId(attempt.tryout),
          targetSubtest: getAttemptSubtestIndex(attempt),
          now,
          allowLegacySecondsFallback: true,
          forceReset: shouldForceReset,
        });
        const shouldPersistTimer =
          attempt.subtestStartedAt !== resumedTimer.subtestStartedAt ||
          attempt.subtestDeadlineAt !== resumedTimer.subtestDeadlineAt;

        if (!shouldPersistTimer) {
          return {
            ...attempt,
            secondsRemaining: resumedTimer.secondsRemaining,
            serverNow: nowIso,
          } as TryoutAttempt;
        }

        const resumedAttempt = await payload.update({
          collection: "tryout-attempts",
          id: attempt.id,
          data: {
            subtestStartedAt: resumedTimer.subtestStartedAt,
            subtestDeadlineAt: resumedTimer.subtestDeadlineAt,
            secondsRemaining: resumedTimer.secondsRemaining,
          },
        });

        return {
          ...(resumedAttempt as unknown as TryoutAttempt),
          serverNow: nowIso,
        } as TryoutAttempt;
      }

      if (attempt.allowRetake) {
        const baseAnswers =
          attempt.retakeAnswers && Object.keys(attempt.retakeAnswers).length > 0
            ? attempt.retakeAnswers
            : attempt.answers || {};
        const baseFlags =
          attempt.retakeFlags && Object.keys(attempt.retakeFlags).length > 0
            ? attempt.retakeFlags
            : attempt.flags || {};
        const shouldInit = attempt.retakeStatus !== "running";
        const maxRetake = Number.isFinite(attempt.maxRetake)
          ? Math.max(0, Math.floor(attempt.maxRetake as number))
          : 1;
        const retakeCount = Number.isFinite(attempt.retakeCount)
          ? Math.max(0, Math.floor(attempt.retakeCount as number))
          : 0;
        if (shouldInit && maxRetake > 0 && retakeCount >= maxRetake) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Batas maksimal retake sudah tercapai.",
          });
        }
        const targetSubtest = shouldInit ? 0 : getRetakeSubtestIndex(attempt);
        const timerWindow = await buildRetakeTimerWindow({
          payload: payload as PayloadLike,
          attempt,
          tryoutId: getTryoutId(attempt.tryout),
          targetSubtest,
          now,
          allowLegacySecondsFallback: true,
          forceReset: shouldInit,
        });
        const updateData: Record<string, unknown> = {
          retakeStatus: "running",
          retakeSubtestStartedAt: timerWindow.subtestStartedAt,
          retakeSubtestDeadlineAt: timerWindow.subtestDeadlineAt,
          retakeSecondsRemaining: timerWindow.secondsRemaining,
          heartbeatAt: nowIso,
        };
        if (shouldInit) {
          updateData.retakeStartedAt = nowIso;
          updateData.retakeCurrentSubtest = 0;
          updateData.retakeCurrentQuestionIndex = 0;
          updateData.retakeAnswers = baseAnswers;
          updateData.retakeFlags = baseFlags;
          updateData.retakeProcessedBatchIds = [];
          updateData.retakeEventRevisions = {};
          updateData.retakeSubtestStates = {};
          updateData.retakeSubtestSnapshots = [];
          updateData.retakeCount = retakeCount + 1;
        }
        const resumedAttempt = await payload.update({
          collection: "tryout-attempts",
          id: attempt.id,
          data: updateData,
        });
        return {
          ...(resumedAttempt as unknown as TryoutAttempt),
          serverNow: nowIso,
        } as TryoutAttempt;
      }

      return {
        ...attempt,
        serverNow: nowIso,
      } as TryoutAttempt;
    }

    // Only enforce window check for BRAND NEW attempts — not resume/retake
    assertTryoutWindowOpen(tryoutWindow, "memulai tryout", now);

    const tryoutId = input.tryoutId;
    const timerWindow = await buildServerTimerWindow({
      payload: payload as PayloadLike,
      attempt: {
        currentSubtest: 0,
        subtestStartedAt: null,
        subtestDeadlineAt: null,
        secondsRemaining: null,
      } as unknown as TryoutAttempt,
      tryoutId,
      targetSubtest: 0,
      now,
    });
    const newAttempt = await payload.create({
      collection: "tryout-attempts",
      data: {
        tryout: tryoutId,
        user: session.user.id,
        status: "started",
        startedAt: nowIso,
        currentSubtest: 0,
        subtestStartedAt: timerWindow.subtestStartedAt,
        subtestDeadlineAt: timerWindow.subtestDeadlineAt,
        secondsRemaining: timerWindow.secondsRemaining,
        heartbeatAt: nowIso,
      },
    });

    return {
      ...(newAttempt as unknown as TryoutAttempt),
      serverNow: nowIso,
    } as TryoutAttempt;
  });
