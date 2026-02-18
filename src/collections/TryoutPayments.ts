import type { CollectionConfig } from "payload";
import { isAdminOrAbove } from "./accessHelpers";

export const TryoutPayments: CollectionConfig = {
  slug: "tryout-payments",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "tryout", "status", "amount", "program", "createdAt"],
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
    },
    {
      name: "attempt",
      type: "relationship",
      relationTo: "tryout-attempts",
      required: true,
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
};
