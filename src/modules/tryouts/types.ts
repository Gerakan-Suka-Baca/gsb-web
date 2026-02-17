import { inferRouterOutputs } from "@trpc/server";

import type { appRouter } from "@/trpc/routers/_app";

export type TryoutAttempt = {
  id: string;
  user: string | { id: string };
  tryout: string | { id: string };
  status: "started" | "completed";
  answers: Record<string, Record<string, string>>;
  flags: Record<string, Record<string, boolean>>;
  processedBatchIds?: string[];
  currentSubtest?: number;
  currentQuestionIndex?: number;
  examState?: "running" | "bridging" | "paused";
  secondsRemaining?: number;
  bridgingExpiry?: string;
  subtestStartedAt?: string;
  subtestDeadlineAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  score?: number;
  correctAnswersCount?: number;
  totalQuestionsCount?: number;
  questionResults?: unknown[]; 
  resultPlan?: "free" | "paid";
  serverNow?: string;
  [key: string]: unknown; 
};

export type TryoutsGetManyOutput = inferRouterOutputs<
  typeof appRouter
>["tryouts"]["getMany"];
