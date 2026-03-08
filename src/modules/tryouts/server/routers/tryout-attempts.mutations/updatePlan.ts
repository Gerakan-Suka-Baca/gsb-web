import z from "zod";

import { protectedProcedure } from "@/trpc/init";
import { getTryoutId, validateTryoutAttempt } from "@/modules/tryouts/utils/tryout-utils";

import type { TryoutAttempt } from "@/modules/tryouts/types";

export const updatePlan = protectedProcedure
  .input(
    z.object({
      attemptId: z.string(),
      plan: z.enum(["free", "paid"]),
      paymentMethod: z.enum(["qris", "voucher"]).optional(),
      voucherCode: z.string().trim().min(3).max(64).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db: payload, session } = ctx;

    const attemptRaw = (await payload.findByID({
      collection: "tryout-attempts",
      id: input.attemptId,
    })) as unknown as TryoutAttempt;

    validateTryoutAttempt(attemptRaw, session.user.id, {
      allowCompleted: true,
    });

    const tryoutId = getTryoutId(attemptRaw.tryout);

    const paymentMethod =
      input.plan === "free"
        ? "free"
        : input.paymentMethod === "voucher"
          ? "voucher"
          : "qris";

    await payload.update({
      collection: "tryout-attempts",
      id: input.attemptId,
      data: {
        resultPlan: input.plan,
        paymentMethod,
        adminConfirmation:
          input.plan === "free"
            ? "approved"
            : paymentMethod === "voucher"
              ? "approved"
              : "pending",
      },
    });

    let paymentStatus: "none" | "pending" | "verified" | "rejected" = "none";
    let resolvedVoucherId: string | null = null;
    let resolvedVoucherCode: string | null = null;

    if (input.plan === "paid" && paymentMethod === "voucher") {
      if (!input.voucherCode) {
        throw new Error("Kode voucher wajib diisi");
      }
      const normalizedCode = input.voucherCode.trim().toUpperCase();
      const voucherResult = await payload.find({
        collection: "tryout-vouchers",
        where: { code: { equals: normalizedCode } },
        limit: 1,
        depth: 0,
      });
      const voucherDoc = voucherResult.docs[0] as
        | {
            id?: string;
            code?: string;
            active?: boolean;
            isPermanent?: boolean;
            validFrom?: string;
            validUntil?: string;
            quota?: number;
            usedCount?: number;
          }
        | undefined;
      if (!voucherDoc?.id) {
        throw new Error("Voucher tidak valid");
      }
      if (voucherDoc.active === false) {
        throw new Error("Voucher tidak aktif");
      }
      const now = new Date();
      if (!voucherDoc.isPermanent) {
        if (voucherDoc.validFrom && now < new Date(voucherDoc.validFrom)) {
          throw new Error("Voucher belum berlaku");
        }
        if (voucherDoc.validUntil && now > new Date(voucherDoc.validUntil)) {
          throw new Error("Voucher sudah berakhir");
        }
      }
      if (typeof voucherDoc.quota === "number" && (voucherDoc.usedCount ?? 0) >= voucherDoc.quota) {
        throw new Error("Kuota voucher sudah habis");
      }
      resolvedVoucherId = voucherDoc.id;
      resolvedVoucherCode = voucherDoc.code ?? normalizedCode;
    }

    if (input.plan === "paid" || input.plan === "free") {
      const existingPayments = await payload.find({
        collection: "tryout-payments",
        where: {
          and: [
            { user: { equals: session.user.id } },
            { tryout: { equals: tryoutId } },
            { attempt: { equals: input.attemptId } },
          ],
        },
        limit: 1,
        sort: "-createdAt",
        depth: 0,
      });

      const existingPayment = existingPayments.docs[0] as { id?: string; status?: "pending" | "verified" | "rejected" } | undefined;
      const nextStatus =
        input.plan === "free"
          ? "verified"
          : paymentMethod === "voucher"
            ? "verified"
            : existingPayment?.status === "verified"
              ? "verified"
              : "pending";

      if (existingPayment?.id) {
        const updated = await payload.update({
          collection: "tryout-payments",
          id: existingPayment.id,
          data: {
            status: nextStatus,
            paymentMethod: input.plan === "free" ? "free" : (paymentMethod as "qris" | "voucher"),
            voucher: resolvedVoucherId,
            voucherCode: resolvedVoucherCode,
            paymentDate: new Date().toISOString(),
          },
        });
        paymentStatus = (updated as { status?: "pending" | "verified" | "rejected" }).status ?? "pending";
      } else {
        const created = await payload.create({
          collection: "tryout-payments",
          data: {
            user: session.user.id,
            tryout: tryoutId,
            attempt: input.attemptId,
            status: nextStatus,
            paymentMethod: input.plan === "free" ? "free" : (paymentMethod as "qris" | "voucher"),
            voucher: resolvedVoucherId,
            voucherCode: resolvedVoucherCode,
            paymentDate: new Date().toISOString(),
          },
        });
        paymentStatus = (created as { status?: "pending" | "verified" | "rejected" }).status ?? "none";
      }
    }

    return { success: true, paymentStatus };
  });
