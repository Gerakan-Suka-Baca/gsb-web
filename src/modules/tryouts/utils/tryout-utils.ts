import { Question } from "@/payload-types";
import { TryoutAttempt } from "../types";

export const MAX_PROCESSED_BATCHES = 100;

export const getUserId = (user: string | { id: string }): string => {
  return typeof user === "object" ? user.id : user;
};

export const getTryoutId = (tryout: string | { id: string }): string => {
  return typeof tryout === "object" ? tryout.id : tryout;
};

import { TRPCError } from "@trpc/server";

export const validateTryoutAttempt = (
  attempt: TryoutAttempt | null | undefined,
  userId: string,
  options?: { allowCompleted?: boolean }
): TryoutAttempt => {
  if (!attempt || getUserId(attempt.user) !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this attempt",
    });
  }
  if (!options?.allowCompleted && attempt.status === "completed") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tryout already completed",
    });
  }
  return attempt;
};

type SubmissionResult = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  questionResults: {
    subtestId: string;
    questionId: string;
    questionNumber: number;
    selectedLetter: string | null;
    correctLetter: string | null;
    isCorrect: boolean;
    id: string;
  }[];
};

export const calculateSubmissionResults = (
  subtests: Question[],
  answers: Record<string, Record<string, string>>
): SubmissionResult => {
  let totalQuestions = 0;
  let correctCount = 0;

  const questionResults: SubmissionResult["questionResults"] = [];

  for (const subtest of subtests) {
    if (typeof subtest !== "object") continue;

    const subtestAnswers = answers[subtest.id] || {};
    const questions = Array.isArray(subtest.tryoutQuestions)
      ? subtest.tryoutQuestions
      : [];

    if (questions.length === 0) continue;

    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx];
      const qID = q.id || `q-${qIdx}`;
      totalQuestions++;

      const selectedAnswerId = subtestAnswers[qID] || null;
      const qAnswers = q.tryoutAnswers || [];

      let correctAnswerId: string | null = null;
      let correctLetter: string | null = null;
      for (let aIdx = 0; aIdx < qAnswers.length; aIdx++) {
        if (qAnswers[aIdx].isCorrect) {
          correctAnswerId = qAnswers[aIdx].id || null;
          correctLetter = String.fromCharCode(65 + aIdx);
          break;
        }
      }

      let selectedLetter: string | null = null;
      if (selectedAnswerId) {
        const selectedIdx = qAnswers.findIndex(
          (a) => a.id === selectedAnswerId
        );
        if (selectedIdx >= 0)
          selectedLetter = String.fromCharCode(65 + selectedIdx);
      }

      const isCorrect =
        selectedAnswerId !== null && selectedAnswerId === correctAnswerId;
      if (isCorrect) correctCount++;

      questionResults.push({
        subtestId: subtest.id,
        questionId: qID,
        questionNumber: qIdx + 1,
        selectedLetter,
        correctLetter,
        isCorrect,
        id: Math.random().toString(36).substring(2, 10)
      });
    }
  }

  const score =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    score,
    correctCount,
    totalQuestions,
    questionResults,
  };
};
