import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import type { User } from "@/payload-types";
import { getPayloadCached } from "@/lib/payload";

import { cache } from "react";

export type TRPCContext = {
  userId: string | null;
  db: Awaited<ReturnType<typeof getPayloadCached>>;
  session?: { user: User; clerkUserId: string } | null;
};

/** One Payload + one Clerk auth per request (parallel). */
export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  const [db, { userId }] = await Promise.all([getPayloadCached(), clerkAuth()]);
  return { userId: userId ?? null, db };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<TRPCContext>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not logged in",
    });
  }

  // Look up user in DB by clerkUserId
  const existingUsers = await ctx.db.find({
    collection: "users",
    where: { clerkUserId: { equals: ctx.userId } },
    limit: 1,
  });

  const dbUser = existingUsers.docs[0];

  if (!dbUser) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User profile not found. Please complete your profile setup.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        user: dbUser,
        clerkUserId: ctx.userId,
      },
    },
  });
});

/** Like protectedProcedure but does not throw when user not in DB; ctx.session is null then. */
export const optionalUserProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    return next({ ctx: { ...ctx, session: null } });
  }
  const existingUsers = await ctx.db.find({
    collection: "users",
    where: { clerkUserId: { equals: ctx.userId } },
    limit: 1,
  });
  const dbUser = existingUsers.docs[0] ?? null;
  if (!dbUser) {
    return next({ ctx: { ...ctx, session: null } });
  }
  return next({
    ctx: {
      ...ctx,
      session: { user: dbUser, clerkUserId: ctx.userId },
    },
  });
});
