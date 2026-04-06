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
// Avoid exporting the entire t-object since its name clashes with i18n conventions.
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

  // Look up user in Payload CMS by clerkUserId
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

/** Same as protectedProcedure but non-throwing when user is absent; ctx.session will be null. */
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

/** Ensure the caller has an Admin/Volunteer role via Payload Auth (Clerk not required). */
export const adminProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const { headers } = await import("next/headers");
  const reqHeaders = await headers();
  const { user } = await ctx.db.auth({ headers: reqHeaders });

  if (!user || user.collection !== "admins") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Akses ditolak. Harap login melalui halaman khusus Mentor.",
    });
  }

  const role = (user as any).role;
  if (!["super-admin", "admin", "volunteer"].includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Hak akses tidak mencukupi untuk dashboard mentor.",
    });
  }

  // Inject the authenticated admin user into context
  return next({
    ctx: { ...ctx, adminUser: user },
  });
});
