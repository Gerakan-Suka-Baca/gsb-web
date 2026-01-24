import { inferRouterOutputs } from "@trpc/server";

import type { appRouter } from "@/trpc/routers/_app";

export type MembersGetManyOutput = inferRouterOutputs<
  typeof appRouter
>["members"]["getMany"];
