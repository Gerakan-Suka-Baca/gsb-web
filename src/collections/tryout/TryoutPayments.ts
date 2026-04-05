import type { CollectionConfig, Where } from "payload";
import { isAdminOrAbove } from "../accessHelpers";
import { TryoutVouchers } from "../voucher/TryoutVouchers";

const resolveAccountType = () =>
  (process.env.APP_ENV || "").toLowerCase() === "development"
    ? "development"
    : "production";

type AnyRecord = Record<string, unknown>;

const getIdValue = (value: unknown): string | number | null => {
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && value !== null) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return id;
  }
  return null;
};

export const TryoutPayments: CollectionConfig = {
  slug: "tryout-payments",
  admin: {
    useAsTitle: "id",
    group: "Tryout",
    defaultColumns: ["user", "tryout", "paymentMethod", "status", "amount", "program", "createdAt"],
    description: "List user yang sudah melakukan pembayaran manual (untuk verifikasi).",
  },
  access: {
    read: ({ req: { user } }) => isAdminOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      admin: {
        description: "User yang melakukan pembayaran",
      },
    },
    {
      name: "tryout",
      type: "relationship",
      relationTo: "tryouts",
      required: true,
      filterOptions: async ({ data, siblingData, req }) => {
        const sibling = siblingData as AnyRecord | undefined;
        const source = data as AnyRecord | undefined;
        const userId = getIdValue(sibling?.user ?? source?.user);
        if (!userId || !req.payload) return { id: { equals: "__none__" } } as Where;
        const attempts = await req.payload.find({
          collection: "tryout-attempts",
          where: { user: { equals: userId } },
          limit: 200,
          depth: 0,
        });
        const tryoutIds = (attempts.docs ?? [])
          .map((doc) => {
            const t = (doc as { tryout?: string | { id?: string } }).tryout;
            return typeof t === "object" && t !== null ? t.id : t;
          })
          .filter(Boolean) as string[];
        if (tryoutIds.length === 0) return { id: { equals: "__none__" } } as Where;
        return { id: { in: tryoutIds } } as Where;
      },
    },
    {
      name: "attempt",
      type: "relationship",
      relationTo: "tryout-attempts",
      required: true,
      filterOptions: async ({ data, siblingData, req }) => {
        const sibling = siblingData as AnyRecord | undefined;
        const source = data as AnyRecord | undefined;
        const userId = getIdValue(sibling?.user ?? source?.user);
        const tryoutId = getIdValue(sibling?.tryout ?? source?.tryout);
        if (!userId || !req.payload) return { id: { equals: "__none__" } } as Where;
        if (!tryoutId) return { user: { equals: userId } } as Where;
        return {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: tryoutId } },
          ],
        } as Where;
      },
    },
    {
      name: "paymentMethod",
      type: "select",
      label: "Metode Pembayaran",
      required: true,
      defaultValue: "qris",
      options: [
        { label: "Gratis", value: "free" },
        { label: "QRIS", value: "qris" },
        { label: "Voucher", value: "voucher" },
      ],
    },
    {
      name: "voucher",
      type: "relationship",
      relationTo: "tryout-vouchers",
      admin: {
        condition: (_, siblingData) => siblingData?.paymentMethod === "voucher",
      },
    },
    {
      name: "voucherCode",
      type: "text",
      label: "Kode Voucher",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending Verification", value: "pending" },
        { label: "Verified / Paid", value: "verified" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "pending",
      required: true,
      index: true,
    },
    {
      name: "accountType",
      type: "select",
      options: [
        { label: "Production", value: "production" },
        { label: "Development", value: "development" },
      ],
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      index: true,
    },
    {
      name: "program",
      type: "text",
      defaultValue: "Tryout SNBT Premium",
    },
    {
      name: "amount",
      type: "number",
      defaultValue: 5000,
      admin: {
        description: "Nominal pembayaran",
      },
    },
    {
      name: "paymentDate",
      type: "date",
      defaultValue: () => new Date(),
    },
    {
      name: "notes",
      type: "textarea",
      label: "Catatan Admin",
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (!data || !req.payload) return data;
        const payloadData = data as AnyRecord;
        const userId = getIdValue(payloadData.user);
        if (operation === "create" && userId) {
          try {
            const user = await req.payload.findByID({
              collection: "users",
              id: userId,
            });
            if (user) {
              payloadData.accountType = user.accountType || resolveAccountType();
            }
          } catch (error) {
            console.error("Error setting accountType for payment:", error);
          }
        }
        if (!payloadData.amount) payloadData.amount = 5000;
        if (!payloadData.paymentMethod) payloadData.paymentMethod = "qris";
        if (payloadData.paymentMethod === "voucher" && !payloadData.paymentDate) {
          payloadData.paymentDate = new Date().toISOString();
        }
        if (payloadData.paymentMethod === "qris" && payloadData.status === "verified" && !payloadData.paymentDate) {
          throw new Error("Tanggal pembayaran wajib diisi saat status QRIS disetujui");
        }

        const attemptId = getIdValue(payloadData.attempt);
        if (attemptId && !payloadData.tryout) {
          const attempt = await req.payload.findByID({
            collection: "tryout-attempts",
            id: attemptId,
            depth: 0,
          });
          const tryoutValue = (attempt as { tryout?: string | { id?: string } }).tryout;
          const tryoutId = typeof tryoutValue === "object" && tryoutValue !== null ? tryoutValue.id : tryoutValue;
          if (tryoutId) payloadData.tryout = tryoutId;
        }

        if (payloadData.paymentMethod === "voucher") {
          const voucherId = getIdValue(payloadData.voucher);
          if (!voucherId) throw new Error("Voucher wajib dipilih");
          const voucher = await req.payload.findByID({
            collection: "tryout-vouchers",
            id: voucherId,
            depth: 0,
          });
          const v = voucher as {
            code?: string;
            active?: boolean;
            isPermanent?: boolean;
            validFrom?: string;
            validUntil?: string;
            quota?: number;
            usedCount?: number;
          };
          if (v.active === false) throw new Error("Voucher tidak aktif");
          const now = new Date();
          if (!v.isPermanent) {
            if (v.validFrom && now < new Date(v.validFrom)) throw new Error("Voucher belum berlaku");
            if (v.validUntil && now > new Date(v.validUntil)) throw new Error("Voucher sudah berakhir");
          }
          if (typeof v.quota === "number" && (v.usedCount ?? 0) >= v.quota) {
            throw new Error("Kuota voucher sudah habis");
          }
          payloadData.voucherCode = v.code || payloadData.voucherCode;
        } else {
          payloadData.voucher = null;
          payloadData.voucherCode = null;
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (!req.payload) return doc;
        const paymentDoc = doc as AnyRecord;
        const attemptId = getIdValue(paymentDoc.attempt);
        if (attemptId) {
          const normalizedPaymentMethod =
            paymentDoc.paymentMethod === "free" ||
            paymentDoc.paymentMethod === "qris" ||
            paymentDoc.paymentMethod === "voucher"
              ? paymentDoc.paymentMethod
              : "none";
          const nextAdminConfirmation =
            paymentDoc.status === "verified"
              ? "approved"
              : paymentDoc.status === "pending"
                ? "pending"
                : paymentDoc.status === "rejected"
                  ? "rejected"
                  : "none";
          await req.payload.update({
            collection: "tryout-attempts",
            id: attemptId,
            data: {
              resultPlan: normalizedPaymentMethod === "free" ? "free" : "paid",
              paymentMethod: normalizedPaymentMethod,
              adminConfirmation: nextAdminConfirmation,
            },
          });
        }
        if (operation === "create" && paymentDoc.paymentMethod === "voucher") {
          const voucherId = getIdValue(paymentDoc.voucher);
          if (!voucherId) return doc;
          const current = await req.payload.findByID({
            collection: "tryout-vouchers",
            id: voucherId,
            depth: 0,
          });
          const usedCount = ((current as { usedCount?: number }).usedCount ?? 0) + 1;
          await req.payload.update({
            collection: "tryout-vouchers",
            id: voucherId,
            data: {
              usedCount,
              lastUsedAt: (doc as { paymentDate?: string }).paymentDate || new Date().toISOString(),
            },
          });
        }
        return doc;
      },
    ],
  },
};
