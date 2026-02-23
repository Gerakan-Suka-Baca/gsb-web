"use client";

import { useEffect } from "react";
import { type TryoutAttempt } from "../../types";
import { loadBackup, getPendingEvents } from "@/lib/tryout-storage";
import type { AnswerMap, FlagMap, ExamStatus, ExamState } from "./useExamState";
import type { Question } from "@/payload-types";

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
      const serverSubtest = data.currentSubtest ?? 0;
      const serverQuestion = data.currentQuestionIndex ?? 0;
      const storedAnswers = (data.answers as Record<string, AnswerMap> | null | undefined) || {};
      const storedFlags = (data.flags as Record<string, FlagMap> | null | undefined) || {};

      let finalSubtest = typeof serverSubtest === "number" && !isNaN(serverSubtest) ? serverSubtest : 0;
      let finalQuestion = typeof serverQuestion === "number" && !isNaN(serverQuestion) ? serverQuestion : 0;
      let finalSeconds: number | undefined;
      let finalSubtestStartedAt =
        typeof data.subtestStartedAt === "string"
          ? data.subtestStartedAt
          : undefined;
      let finalSubtestDeadlineAt =
        typeof data.subtestDeadlineAt === "string"
          ? data.subtestDeadlineAt
          : undefined;
      let finalStatus: ExamStatus =
        data.status === "completed"
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
      const mergedDurations = { ...((data.subtestDurations as Record<string, number> | undefined) || {}) };

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

        if (Number.isFinite(backup.currentSubtest) && backup.currentSubtest > finalSubtest) {
          finalSubtest = backup.currentSubtest;
          finalQuestion = Number.isFinite(backup.currentQuestionIndex) ? backup.currentQuestionIndex ?? 0 : 0;
          finalSeconds = backup.secondsRemaining;
          finalSubtestStartedAt = undefined;
          finalSubtestDeadlineAt = undefined;
          if (backup.examState) finalStatus = backup.examState as ExamStatus;
        } else if (backup.currentSubtest === finalSubtest) {
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
    };

    run();
    return () => {
      active = false;
    };
  }, [attempt, isLoading, subtests, currentAttemptId, onRestore]);
}
