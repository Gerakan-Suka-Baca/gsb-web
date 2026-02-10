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
