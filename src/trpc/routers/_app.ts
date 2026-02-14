import { authRouter } from "@/modules/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { tryoutsRouter } from "@/modules/tryouts/server/procedures";
import { tryoutAttemptsRouter } from "@/modules/tryouts/server/routers/tryout-attempts";

export const appRouter = createTRPCRouter({
  tryouts: tryoutsRouter,
  tryoutAttempts: tryoutAttemptsRouter,
  auth: authRouter,
});
export type AppRouter = typeof appRouter;
