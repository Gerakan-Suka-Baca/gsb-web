"use client";

import { useEffect } from "react";
import { type TryoutAttempt } from "../../types";
import { loadBackup, getPendingEvents } from "@/lib/tryout-storage";
import type { AnswerMap, FlagMap, ExamStatus, ExamState } from "./useExamState";
import type { Question } from "@/payload-types";
import { usePostHog } from "posthog-js/react";

interface UseAttemptRestorationProps {
  attempt: unknown;
  isLoading: boolean;
  subtests: Question[];
  currentAttemptId?: string | null;
  onRestore: (
    state: Partial<ExamState> & {
      timeLeft?: number;
      subtestStartedAt?: string;
      subtestDeadlineAt?: string;
      subtestDurations?: Record<string, number>;
    }
  ) => void;
}

function isValidAttempt(attempt: unknown): attempt is TryoutAttempt {
  return (
    typeof attempt === "object" &&
    attempt !== null &&
    "id" in attempt &&
    "currentSubtest" in attempt
  );
}

function parseDateMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function useAttemptRestoration({
  attempt,
  isLoading,
  subtests,
  currentAttemptId,
  onRestore,
}: UseAttemptRestorationProps) {
  const posthog = usePostHog();
  useEffect(() => {
    if (isLoading) return;
    if (!isValidAttempt(attempt)) {
      if (!currentAttemptId) {
         onRestore({ status: "ready" });
      }
      return;
    }

    if (currentAttemptId && attempt.id !== currentAttemptId) {
      return;
    }

    let active = true;
    const data = attempt;

    const run = async () => {
      const retakeActive =
        Boolean(data.allowRetake) && data.retakeStatus === "running";
      const retakeEligible =
        Boolean(data.allowRetake) && data.retakeStatus !== "completed";
      const serverSubtest = retakeActive
        ? data.retakeCurrentSubtest ?? 0
        : data.currentSubtest ?? 0;
      const serverQuestion = retakeActive
        ? data.retakeCurrentQuestionIndex ?? 0
        : data.currentQuestionIndex ?? 0;
      const storedAnswers = (retakeActive ? data.retakeAnswers : data.answers) as
        | Record<string, AnswerMap>
        | null
        | undefined || {};
      const storedFlags = (retakeActive ? data.retakeFlags : data.flags) as
        | Record<string, FlagMap>
        | null
        | undefined || {};

      let finalSubtest = typeof serverSubtest === "number" && !isNaN(serverSubtest) ? serverSubtest : 0;
      let finalQuestion = typeof serverQuestion === "number" && !isNaN(serverQuestion) ? serverQuestion : 0;
      let finalSeconds: number | undefined;
      const finalSubtestStartedAt =
        typeof (retakeActive ? data.retakeSubtestStartedAt : data.subtestStartedAt) === "string"
          ? (retakeActive ? data.retakeSubtestStartedAt : data.subtestStartedAt)
          : undefined;
      const finalSubtestDeadlineAt =
        typeof (retakeActive ? data.retakeSubtestDeadlineAt : data.subtestDeadlineAt) === "string"
          ? (retakeActive ? data.retakeSubtestDeadlineAt : data.subtestDeadlineAt)
          : undefined;
      const finalStatus: ExamStatus = retakeActive
        ? "running"
        : retakeEligible && data.status === "completed"
          ? "ready"
          : data.status === "completed"
            ? "finished"
            : (data.examState as ExamStatus) || "running";

      const serverDeadlineMs = parseDateMs(finalSubtestDeadlineAt);
      if (serverDeadlineMs !== null) {
        finalSeconds = Math.max(
          0,
          Math.ceil((serverDeadlineMs - Date.now()) / 1000)
        );
      }

      const mergedAnswers = { ...storedAnswers };
      const mergedFlags = { ...storedFlags };
      const mergedDurations = {
        ...(((retakeActive ? data.retakeSubtestDurations : data.subtestDurations) as
          | Record<string, number>
          | undefined) || {}),
      };

      const backup = await loadBackup(data.id);
      if (backup) {
        Object.keys(backup.answers || {}).forEach((sId) => {
          mergedAnswers[sId] = {
            ...(mergedAnswers[sId] || {}),
            ...backup.answers[sId],
          };
        });
        Object.keys(backup.flags || {}).forEach((sId) => {
          mergedFlags[sId] = {
            ...(mergedFlags[sId] || {}),
            ...backup.flags[sId],
          };
        });
        Object.keys(backup.subtestDurations || {}).forEach((sId) => {
          mergedDurations[sId] = backup.subtestDurations[sId];
        });

        if (backup.currentSubtest === finalSubtest) {
          const backupQ = Number.isFinite(backup.currentQuestionIndex) ? backup.currentQuestionIndex ?? 0 : 0;
          finalQuestion = Math.max(finalQuestion, backupQ);
          if (
            backup.secondsRemaining !== undefined &&
            backup.updatedAt > (Date.parse(data.updatedAt ?? "") || 0) &&
            finalSubtestDeadlineAt === undefined
          ) {
            finalSeconds = backup.secondsRemaining;
          }
        }
      }

      const pendingEvents = await getPendingEvents(data.id);
      for (const event of pendingEvents) {
        if (event.kind === "answer") {
          const sub = mergedAnswers[event.subtestId] ? { ...mergedAnswers[event.subtestId] } : {};
          if (event.answerId !== undefined) sub[event.questionId] = event.answerId;
          mergedAnswers[event.subtestId] = sub;
        } else {
          const sub = mergedFlags[event.subtestId] ? { ...mergedFlags[event.subtestId] } : {};
          sub[event.questionId] = Boolean(event.flag);
          mergedFlags[event.subtestId] = sub;
        }
      }

      if (!active) return;
      
      const normalizedStatus = (finalStatus as string) === "paused" ? "running" : finalStatus;
      if (retakeEligible && !retakeActive && data.status === "completed") {
        finalSubtest = 0;
        finalQuestion = 0;
      }
      if (!Number.isFinite(finalSubtest) || finalSubtest < 0) finalSubtest = 0;
      if (subtests.length > 0 && finalSubtest >= subtests.length) finalSubtest = 0;
      if (!Number.isFinite(finalQuestion) || finalQuestion < 0) finalQuestion = 0;

      onRestore({
        attemptId: data.id,
        currentSubtestIndex: finalSubtest,
        currentQuestionIndex: finalQuestion,
        answers: mergedAnswers,
        flags: mergedFlags,
        status: normalizedStatus as ExamStatus,
        timeLeft: finalSeconds,
        subtestStartedAt: finalSubtestStartedAt,
        subtestDeadlineAt: finalSubtestDeadlineAt,
        subtestDurations: mergedDurations,
      });
      posthog.capture("tryout_restore", {
        attempt_id: data.id,
        used_backup: Boolean(backup),
        pending_events: pendingEvents.length,
        current_subtest: finalSubtest,
        current_question: finalQuestion,
        status: normalizedStatus,
      });
    };

    run();
    return () => {
      active = false;
    };
  }, [attempt, isLoading, subtests, currentAttemptId, onRestore, posthog]);
}
