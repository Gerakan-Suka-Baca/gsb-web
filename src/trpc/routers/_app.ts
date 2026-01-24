import { authRouter } from "@/modules/auth/server/procedures";
import { createTRPCRouter } from "../init";

import { tryoutsRouter } from "@/modules/tryouts/server/procedures";

export const appRouter = createTRPCRouter({
  tryouts: tryoutsRouter,
  auth: authRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
