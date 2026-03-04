import { initTRPC, TRPCError } from "@trpc/server";
import { getPayloadCached } from "@/lib/payload";
import superjson from "superjson";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import type { User } from "@/payload-types";

import { cache } from "react";

type SessionContext = {
  user: User;
  clerkUserId: string;
};

export const createTRPCContext = cache(async () => {
  const { userId } = await clerkAuth();
  const db = await getPayloadCached();
  return { userId: userId ?? null, db, session: null as SessionContext | null };
});

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
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
  const { userId } = await clerkAuth();

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Pengguna belum login",
    });
  }

  // Look up user in DB by clerkUserId
  const existingUsers = await ctx.db.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });

  const dbUser = existingUsers.docs[0];

  if (!dbUser) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Profil pengguna tidak ditemukan. Silakan lengkapi profil.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        user: dbUser,
        clerkUserId: userId,
      },
    },
  });
});

/** Like protectedProcedure but does not throw when user not in DB; ctx.session is null then. */
export const optionalUserProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const { userId } = await clerkAuth();
  if (!userId) {
    return next({ ctx: { ...ctx, session: null as SessionContext | null } });
  }
  const existingUsers = await ctx.db.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });
  const dbUser = existingUsers.docs[0] ?? null;
  if (!dbUser) {
    return next({ ctx: { ...ctx, session: null as SessionContext | null } });
  }
  return next({
    ctx: {
      ...ctx,
      session: { user: dbUser as User, clerkUserId: userId } as SessionContext | null,
    },
  });
});
