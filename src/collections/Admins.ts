import type { CollectionConfig } from "payload";
import { isAdminOrAbove, isSuperAdmin } from "./accessHelpers";

export const Admins: CollectionConfig = {
  slug: "admins",
  auth: true,
  admin: {
    useAsTitle: "email",
    group: "Admin",
  },
  access: {
    read: ({ req: { user } }) => isAdminOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
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
        position: "sidebar",
      },
    },
    {
      name: "name",
      type: "text",
      label: "Nama",
    },
  ],
};
