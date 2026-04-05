import { authRouter } from "@/modules/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { tryoutsRouter } from "@/modules/tryouts/server/procedures";
import { tryoutAttemptsRouter } from "@/modules/tryouts/server/routers/tryout-attempts";
import { podcastRouter } from "@/modules/podcast/server/procedures";
import { universitasRouter } from "@/modules/universitas/server/procedures";
import { mentorDashboardRouter } from "@/modules/mentor-dashboard/server/procedures";

export const appRouter = createTRPCRouter({
  tryouts: tryoutsRouter,
  tryoutAttempts: tryoutAttemptsRouter,
  auth: authRouter,
  podcast: podcastRouter,
  universitas: universitasRouter,
  mentor: mentorDashboardRouter,
});
export type AppRouter = typeof appRouter;
