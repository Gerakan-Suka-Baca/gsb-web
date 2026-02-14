import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  access: {
    admin: ({ req: { user } }) => {
      return Boolean(
        (user && "roles" in user && user.roles?.includes("admin")) ||
        (user && "roles" in user && user.roles?.includes("super-admin")),
      );
    },
  },
  auth: true,
  fields: [
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "fullName",
      label: "Nama Lengkap",
      type: "text",
    },
    {
      name: "whatsapp",
      label: "Nomor WhatsApp",
      type: "text",
    },
    {
      name: "schoolOrigin",
      label: "Asal Sekolah",
      type: "text",
    },
    {
      name: "grade",
      label: "Kelas / Angkatan",
      type: "select",
      options: [
        { label: "Kelas 10", value: "10" },
        { label: "Kelas 11", value: "11" },
        { label: "Kelas 12", value: "12" },
        { label: "Gap Year / Alumni", value: "gap_year" },
      ],
    },
    {
      name: "targetPTN",
      label: "Target PTN",
      type: "text",
    },
    {
      name: "targetMajor",
      label: "Target Jurusan",
      type: "text",
    },
    { name: "paid", type: "checkbox", defaultValue: false },
    { name: "payment", type: "relationship", relationTo: "media" },
    {
      admin: {
        position: "sidebar",
      },
      name: "roles",
      type: "select",
      defaultValue: ["user"],
      hasMany: true,
      options: ["super-admin", "admin", "user"],
      access: {
        update: ({ req: { user } }) => {
          return Boolean(
            user && "roles" in user && user.roles?.includes("super-admin"),
          );
        },
      },
    },
  ],
};
