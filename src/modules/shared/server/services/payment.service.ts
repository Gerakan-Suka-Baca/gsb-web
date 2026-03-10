/**
 * Generic payment resolution service.
 * Usable by any module that needs to determine payment type
 * (Tryout, Donasi, LMS, Kelas Pendaftaran, etc.)
 *
 * Moved from tryouts/server/services/payment.service.ts
 */

import type { TryoutScoreDoc } from "@/modules/shared/types/university.types";
import type { PaymentPlan } from "@/modules/shared/types/payment.types";

export const resolvePaymentType = (
  resultPlan: PaymentPlan | undefined,
  scoreDoc: TryoutScoreDoc | Record<string, unknown> | undefined
): "free" | "paid" => {
  if (resultPlan === "paid") return "paid";
  const scorePaymentType = (scoreDoc as { paymentType?: "free" | "paid" } | undefined)?.paymentType;
  return scorePaymentType ?? "free";
};
