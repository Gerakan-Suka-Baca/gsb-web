import { protectedProcedure } from "@/trpc/init";

export const getMyPaymentHistory = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return [];
    const payments = await ctx.db.find({
      collection: "tryout-payments",
      where: { user: { equals: userId } },
      sort: "-createdAt",
      depth: 1,
      limit: 200,
    });
    return (payments.docs ?? []).map((doc) => {
      const p = doc as unknown as Record<string, unknown>;
      const tryoutValue = p.tryout as Record<string, unknown> | string | undefined;
      const tryoutTitle = typeof tryoutValue === "object" && tryoutValue !== null
        ? (tryoutValue.title as string | undefined) ?? "Tryout"
        : "Tryout";
      return {
        id: String(p.id ?? ""),
        tryoutTitle,
        program: (p.program as string | undefined) ?? "Tryout SNBT Premium",
        amount: Number(p.amount ?? 0),
        status: (p.status as "pending" | "verified" | "rejected" | undefined) ?? "pending",
        paymentMethod: (p.paymentMethod as "free" | "qris" | "voucher" | undefined) ?? "qris",
        voucherCode: (p.voucherCode as string | undefined) ?? null,
        paymentDate: (p.paymentDate as string | undefined) ?? null,
        createdAt: (p.createdAt as string | undefined) ?? null,
      };
    });
  });
