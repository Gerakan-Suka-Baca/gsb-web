/**
 * Tryout-specific content utilities.
 * Functions that only make sense in the context of tryout questions.
 */

import { Question } from "@/payload-types";

/**
 * Strip answer keys (isCorrect) from subtest questions
 * so the client cannot see correct answers during an exam.
 */
export const stripAnswerKeyFromSubtest = (subtest: Question): Question => {
  const tryoutQuestions = Array.isArray(subtest.tryoutQuestions)
    ? subtest.tryoutQuestions
    : [];

  const sanitizedQuestions = tryoutQuestions.map((question) => {
    const tryoutAnswers = Array.isArray(question.tryoutAnswers)
      ? question.tryoutAnswers
      : [];

    return {
      ...question,
      tryoutAnswers: tryoutAnswers.map((answer) => {
        const runtimeAnswer = { ...answer } as Record<string, unknown>;
        delete runtimeAnswer.isCorrect;
        return runtimeAnswer;
      }),
    };
  });

  return {
    ...subtest,
    tryoutQuestions: sanitizedQuestions,
  } as unknown as Question;
};
