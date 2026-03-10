/**
 * Voucher validation service.
 * Extracted from tryout-attempts updatePlan mutation.
 * Reusable for any module that accepts voucher payments.
 */

export type PayloadLike = {
  find: (args: {
    collection: string;
    where: unknown;
    limit: number;
    depth: number;
  }) => Promise<{ docs?: unknown[] }>;
};

export type ResolvedVoucher = {
  voucherId: string;
  voucherCode: string;
};

/**
 * Validates a voucher code against the tryout-vouchers collection.
 * Throws descriptive errors if voucher is invalid, inactive, expired, or exhausted.
 */
export const validateAndResolveVoucher = async (
  payload: PayloadLike,
  voucherCode: string
): Promise<ResolvedVoucher> => {
  const normalizedCode = voucherCode.trim().toUpperCase();

  const voucherResult = await payload.find({
    collection: "tryout-vouchers",
    where: { code: { equals: normalizedCode } },
    limit: 1,
    depth: 0,
  });

  const voucherDoc = (voucherResult.docs?.[0] ?? undefined) as
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

  return {
    voucherId: voucherDoc.id,
    voucherCode: voucherDoc.code ?? normalizedCode,
  };
};
