import { currentUser } from "@clerk/nextjs/server";

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { completeProfileSchema } from "../schemas";

type ClerkUser = Awaited<ReturnType<typeof currentUser>>;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const buildUserSeed = (userId: string, clerkUser: ClerkUser, fallbackFullName: string) => {
  const emailAddresses = clerkUser?.emailAddresses ?? [];
  const primaryId = clerkUser?.primaryEmailAddressId;
  const primaryEntry = primaryId ? emailAddresses.find((e) => e.id === primaryId) : null;
  const rawEmail = (primaryEntry?.emailAddress ?? emailAddresses[0]?.emailAddress ?? "").trim();
  const email = isValidEmail(rawEmail)
    ? rawEmail
    : `user-${userId.replace(/[^a-zA-Z0-9]/g, "-")}@example.com`;
  const fullName = (
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() || fallbackFullName
  ).trim();
  const usernameBase = clerkUser?.username ?? (rawEmail ? rawEmail.split("@")[0] : null) ?? userId;
  const username = String(usernameBase).replace(/\s+/g, "-").slice(0, 64) || userId;

  return { email, fullName, username };
};

const upsertUserFromClerk = async ({
  ctx,
  userId,
  clerkUser,
  fallbackFullName,
  errorOnConflict,
}: {
  ctx: { db: Awaited<ReturnType<typeof import("payload").getPayload>> };
  userId: string;
  clerkUser: ClerkUser;
  fallbackFullName: string;
  errorOnConflict: boolean;
}) => {
  const { email, fullName, username } = buildUserSeed(userId, clerkUser, fallbackFullName);

  try {
    const created = await ctx.db.create({
      collection: "users",
      data: {
        clerkUserId: userId,
        email,
        fullName,
        username,
        roles: ["user"],
        profileCompleted: false,
      },
    });
    return created;
  } catch (createErr) {
    const msg = String(createErr instanceof Error ? createErr.message : createErr);
    const isEmailError = /email|invalid|duplicate|unique/i.test(msg);
    if (!isEmailError) {
      throw createErr;
    }

    const byEmail = await ctx.db.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
    });
    const existingByEmail = byEmail.docs[0] as { id: string; clerkUserId?: string | null } | undefined;
    if (!existingByEmail) {
      if (errorOnConflict) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Gagal menyimpan profil. Silakan coba lagi.",
        });
      }
      return null;
    }

    if (!existingByEmail.clerkUserId || existingByEmail.clerkUserId === userId) {
      const updated = await ctx.db.update({
        collection: "users",
        id: existingByEmail.id,
        data: { clerkUserId: userId, email, fullName, username },
      });
      return updated;
    }

    if (errorOnConflict) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email ini sudah terdaftar dengan akun lain.",
      });
    }
    return null;
  }
};

export const authRouter = createTRPCRouter({
  session: baseProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.userId) {
        return { user: null };
      }

      const existingUsers = await ctx.db.find({
        collection: "users",
        where: { clerkUserId: { equals: ctx.userId } },
        limit: 1,
      });

      const dbUser = existingUsers.docs[0] || null;

      if (!dbUser) {
        const clerkUser = await currentUser();
        if (!clerkUser) {
          return { user: null };
        }
        const created = await upsertUserFromClerk({
          ctx,
          userId: ctx.userId,
          clerkUser,
          fallbackFullName: "",
          errorOnConflict: false,
        });
        if (created) {
          return { user: created };
        }
        const { email, fullName, username } = buildUserSeed(ctx.userId, clerkUser, "");
        return {
          user: {
            id: "",
            clerkUserId: ctx.userId,
            email,
            username,
            fullName,
            profileCompleted: false,
            roles: ["user"],
          },
        };
      }

      return { user: dbUser };
    } catch {
      return { user: null };
    }
  }),

  completeProfile: baseProcedure
    .input(completeProfileSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Anda harus login terlebih dahulu.",
        });
      }

      const existingUsers = await ctx.db.find({
        collection: "users",
        where: { clerkUserId: { equals: ctx.userId } },
        limit: 1,
      });

      let user = existingUsers.docs[0];

      if (!user) {
        const clerkUser = await currentUser();
        if (!clerkUser) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Akun tidak ditemukan. Silakan login ulang.",
          });
        }
        const created = await upsertUserFromClerk({
          ctx,
          userId: ctx.userId,
          clerkUser,
          fallbackFullName: input.fullName,
          errorOnConflict: true,
        });
        if (!created) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Gagal menyimpan profil. Silakan coba lagi.",
          });
        }
        user = created;
      }

      await ctx.db.update({
        collection: "users",
        id: user.id,
        data: {
          fullName: input.fullName,
          whatsapp: input.whatsapp,
          dateOfBirth: input.dateOfBirth.toISOString(),
          schoolOrigin: input.schoolOrigin,
          grade: input.grade,
          targetPTN: input.targetPTN,
          targetMajor: input.targetMajor,
          targetPTN2: input.targetPTN2 ?? undefined,
          targetMajor2: input.targetMajor2 ?? undefined,
          profileCompleted: true,
        },
      });

      return { success: true };
    }),
});
