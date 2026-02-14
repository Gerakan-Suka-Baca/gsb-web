import { headers as getHeaders } from "next/headers";

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { loginSchema, registerSchema } from "../schemas";
import { deleteAuthCookie, generateAuthCookie } from "../utils";

export const authRouter = createTRPCRouter({
  session: baseProcedure.query(async ({ ctx }) => {
    const headers = await getHeaders();

    const session = await ctx.db.auth({ headers });

    return session;
  }),
  register: baseProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const existingData = await ctx.db.find({
        collection: "users",
        limit: 1,
        where: { username: { equals: input.username } },
      });

      const existingUser = existingData.docs[0];

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username tidak tersedia, silahkan pilih username lain.",
        });
      }

      await ctx.db.create({
        collection: "users",
        data: {
          email: input.email,
          username: input.username,
          password: input.password,
          fullName: input.fullName,
          whatsapp: input.whatsapp,
          schoolOrigin: input.schoolOrigin,
          grade: input.grade,
          targetPTN: input.targetPTN,
          targetMajor: input.targetMajor,
        },
      });

      const data = await ctx.db.login({
        collection: "users",
        data: {
          email: input.email,
          password: input.password,
        },
      });

      if (!data.token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Gagal membuat akun. Silakan coba lagi.",
        });
      }

      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: data.token,
      });
    }),
  login: baseProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    // 1. Check if user exists first
    const existingUser = await ctx.db.find({
        collection: "users",
        limit: 1,
        where: { email: { equals: input.email } },
    });

    if (existingUser.docs.length === 0) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email tidak terdaftar. Silakan daftar terlebih dahulu.",
        });
    }

    let data;
    try {
      data = await ctx.db.login({
        collection: "users",
        data: {
          email: input.email,
          password: input.password,
        },
      });
    } catch {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Password salah, mohon cek kembali.",
      });
    }

    if (!data.token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Gagal masuk. Silakan coba lagi.",
      });
    }

    await generateAuthCookie({
      prefix: ctx.db.config.cookiePrefix,
      value: data.token,
    });

    return data;
  }),
  logout: baseProcedure.mutation(async ({ ctx }) => {
    await deleteAuthCookie(ctx.db.config.cookiePrefix);
    return { success: true };
  }),
});
