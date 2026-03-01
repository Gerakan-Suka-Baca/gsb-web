import { inferRouterOutputs } from "@trpc/server";

import type { appRouter } from "@/trpc/routers/_app";

export type TryoutAttempt = {
  id: string;
  user: string | { id: string };
  tryout: string | { id: string };
  status: "started" | "completed";
  allowRetake?: boolean;
  maxRetake?: number;
  retakeCount?: number;
  retakeStatus?: "idle" | "running" | "completed";
  answers: Record<string, Record<string, string>>;
  flags: Record<string, Record<string, boolean>>;
  retakeAnswers?: Record<string, Record<string, string>>;
  retakeFlags?: Record<string, Record<string, boolean>>;
  processedBatchIds?: string[];
  retakeProcessedBatchIds?: string[];
  currentSubtest?: number;
  retakeCurrentSubtest?: number;
  currentQuestionIndex?: number;
  retakeCurrentQuestionIndex?: number;
  examState?: "running" | "bridging" | "paused";
  secondsRemaining?: number;
  retakeSecondsRemaining?: number;
  heartbeatAt?: string;
  eventRevisions?: Record<string, number>;
  retakeEventRevisions?: Record<string, number>;
  subtestStates?: Record<string, string>;
  retakeSubtestStates?: Record<string, string>;
  subtestSnapshots?: unknown[];
  retakeSubtestSnapshots?: unknown[];
  bridgingExpiry?: string;
  subtestStartedAt?: string;
  subtestDeadlineAt?: string;
  retakeSubtestStartedAt?: string;
  retakeSubtestDeadlineAt?: string;
  startedAt?: string;
  retakeStartedAt?: string;
  completedAt?: string;
  retakeCompletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  score?: number;
  correctAnswersCount?: number;
  totalQuestionsCount?: number;
  questionResults?: unknown[]; 
  resultPlan?: "free" | "paid";
  retakeSubtestDurations?: Record<string, number>;
  serverNow?: string;
  [key: string]: unknown; 
};

export type TryoutsGetManyOutput = inferRouterOutputs<
  typeof appRouter
>["tryouts"]["getMany"];
