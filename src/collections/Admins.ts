import type { CollectionConfig } from "payload";
import { isSuperAdmin } from "./accessHelpers";

export const Admins: CollectionConfig = {
  slug: "admins",
  auth: true,
  admin: {
    useAsTitle: "email",
    group: "Admin",
    description:
      "Login ke panel Payload. Pilih User yang sudah ada agar email admin sama dengan email di Users (satu integrasi). Role: volunteer = hanya Media, Soal, Tryouts.",
  },
  access: {
    read: ({ req: { user } }) => isSuperAdmin(user),
    create: ({ req: { user } }) => isSuperAdmin(user),
    update: ({ req: { user } }) => isSuperAdmin(user),
    delete: ({ req: { user } }) => isSuperAdmin(user),
  },
  fields: [
    {
      name: "role",
      type: "select",
      label: "Role",
      required: true,
      defaultValue: "admin",
      options: [
        { label: "Super Admin", value: "super-admin" },
        { label: "Admin", value: "admin" },
        { label: "Volunteer", value: "volunteer" },
      ],
      admin: {
        description: "Volunteer: hanya bisa upload media, buat/edit Soal & Tryouts. Admin/Super Admin: akses penuh.",
        position: "sidebar",
      },
    },
    {
      name: "linkedUser",
      type: "relationship",
      relationTo: "users",
      label: "User (email sama dengan Users)",
      admin: {
        description:
          "Pilih user dari koleksi Users. Email login admin akan disamakan dengan email user ini. Lebih baik pilih user yang sudah punya role Admin/Super Admin.",
        position: "sidebar",
      },
    },
    {
      name: "name",
      type: "text",
      label: "Nama",
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data?.linkedUser || !req.payload) return data;
        const userDoc = await req.payload.findByID({
          collection: "users",
          id: typeof data.linkedUser === "object" ? data.linkedUser.id : data.linkedUser,
        });
        if (userDoc?.email) {
          (data as { email?: string }).email = userDoc.email;
        }
        return data;
      },
    ],
  },
};
