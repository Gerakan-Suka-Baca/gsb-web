import { inferRouterOutputs } from "@trpc/server";

import type { appRouter } from "@/trpc/routers/_app";

export type TryoutsGetManyOutput = inferRouterOutputs<
  typeof appRouter
>["tryouts"]["getMany"];
