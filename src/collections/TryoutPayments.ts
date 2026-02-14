import type { CollectionConfig } from "payload";

export const TryoutPayments: CollectionConfig = {
  slug: "tryout-payments",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "tryout", "status", "amount", "program", "createdAt"],
    description: "List user yang sudah melakukan pembayaran manual (untuk verifikasi).",
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && "roles" in user && (user.roles?.includes("admin") || user.roles?.includes("super-admin"))) {
        return true;
      }
      return { user: { equals: user?.id } };
    },
    create: () => true, 
    update: ({ req: { user } }) => {
      return Boolean(
        user && "roles" in user && (user.roles?.includes("admin") || user.roles?.includes("super-admin"))
      );
    },
    delete: ({ req: { user } }) => {
      return Boolean(
        user && "roles" in user && (user.roles?.includes("admin") || user.roles?.includes("super-admin"))
      );
    },
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
