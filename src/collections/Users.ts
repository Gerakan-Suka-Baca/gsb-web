import type { CollectionConfig } from "payload";
import { isAdminOrAbove } from "./accessHelpers";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "fullName",
    group: "Users",
    listSearchableFields: ["fullName", "email", "username"],
  },
  access: {
    admin: ({ req: { user } }) => isAdminOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    read: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
    },
    {
      name: "clerkUserId",
      label: "Clerk User ID",
      type: "text",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "profileCompleted",
      label: "Profil Lengkap",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "username",
      type: "text",
      required: false,
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
      label: "Target PTN (Pilihan 1)",
      type: "text",
    },
    {
      name: "targetMajor",
      label: "Target Jurusan (Pilihan 1)",
      type: "text",
    },
    {
      name: "targetPTN2",
      label: "Target PTN (Pilihan 2)",
      type: "text",
    },
    {
      name: "targetMajor2",
      label: "Target Jurusan (Pilihan 2)",
      type: "text",
    },
    {
      name: "targetPTN3",
      label: "Target PTN (Pilihan 3)",
      type: "text",
    },
    {
      name: "targetMajor3",
      label: "Target Jurusan (Pilihan 3)",
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
        update: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "dateOfBirth",
      label: "Tanggal Lahir",
      type: "date",
      required: false,
    },
  ],
};
