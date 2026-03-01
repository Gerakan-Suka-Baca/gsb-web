import { createTRPCRouter } from "@/trpc/init";
import {
  saveProgress,
  saveProgressBatch,
  startAttempt,
  submitAttempt,
  updatePlan,
} from "./tryout-attempts.mutations";
import { getAttempt, getMyAttempts } from "./tryout-attempts.queries";

export const tryoutAttemptsRouter = createTRPCRouter({
  getAttempt,
  getMyAttempts,
  startAttempt,
  saveProgress,
  saveProgressBatch,
  submitAttempt,
  updatePlan,
});
