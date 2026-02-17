import type { CollectionConfig } from "payload";

const hasAdminRole = (user: unknown) => {
  if (!user || typeof user !== "object") {
    return false;
  }
  const roles = (user as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) {
    return false;
  }
  return roles.includes("admin") || roles.includes("super-admin");
};

export const TryoutPayments: CollectionConfig = {
  slug: "tryout-payments",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "tryout", "status", "amount", "program", "createdAt"],
    description: "List user yang sudah melakukan pembayaran manual (untuk verifikasi).",
  },
  access: {
    read: ({ req: { user } }) => {
      if (hasAdminRole(user)) {
        return true;
      }
      return { user: { equals: user?.id } };
    },
    create: () => true, 
    update: ({ req: { user } }) => hasAdminRole(user),
    delete: ({ req: { user } }) => hasAdminRole(user),
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
