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
  onRestore: (state: Partial<ExamState> & { timeLeft?: number }) => void;
}

function isValidAttempt(attempt: unknown): attempt is TryoutAttempt {
  return (
    typeof attempt === "object" &&
    attempt !== null &&
    "id" in attempt &&
    "currentSubtest" in attempt
  );
}

export function useAttemptRestoration({
  attempt,
  isLoading,
  subtests,
  onRestore,
}: UseAttemptRestorationProps) {
  useEffect(() => {
    if (isLoading) return;
    if (!isValidAttempt(attempt)) {
      onRestore({ status: "ready" });
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
      let finalStatus: ExamStatus =
        data.status === "completed"
          ? "finished"
          : (data.examState as ExamStatus) || "running";

      const mergedAnswers = { ...storedAnswers };
      const mergedFlags = { ...storedFlags };

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

        if (Number.isFinite(backup.currentSubtest) && backup.currentSubtest > finalSubtest) {
          finalSubtest = backup.currentSubtest;
          finalQuestion = Number.isFinite(backup.currentQuestionIndex) ? backup.currentQuestionIndex ?? 0 : 0;
          finalSeconds = backup.secondsRemaining;
          if (backup.examState) finalStatus = backup.examState as ExamStatus;
        } else if (backup.currentSubtest === finalSubtest) {
          const backupQ = Number.isFinite(backup.currentQuestionIndex) ? backup.currentQuestionIndex ?? 0 : 0;
          finalQuestion = Math.max(finalQuestion, backupQ);
          if (
            backup.secondsRemaining !== undefined &&
            backup.updatedAt > (Date.parse(data.updatedAt ?? "") || 0)
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
      });
    };

    run();
    return () => {
      active = false;
    };
  }, [attempt, isLoading, subtests, onRestore]);
}
