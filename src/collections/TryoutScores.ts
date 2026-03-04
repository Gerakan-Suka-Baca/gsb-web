import type { CollectionConfig } from "payload";
import { isVolunteerOrAbove, isAdminOrAbove } from "./accessHelpers";
import { SUBTEST_OPTIONS } from "./subtestOptions";

const resolveAccountType = () =>
  (process.env.APP_ENV || "").toLowerCase() === "development"
    ? "development"
    : "production";

const subtestFields = SUBTEST_OPTIONS.map((opt) => ({
  name: `score_${opt.value}`,
  type: "number" as const,
  label: `${opt.label} (${opt.value})`,
  min: 0,
  max: 1000,
  admin: {
    description: opt.value,
  },
}));

export const TryoutScores: CollectionConfig = {
  slug: "tryout-scores",
  admin: {
    useAsTitle: "id",
    group: "Tryout",
    listSearchableFields: ["user", "tryout"],
    defaultColumns: ["user", "tryout", "finalScore", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => isVolunteerOrAbove(user),
    create: ({ req: { user } }) => isVolunteerOrAbove(user),
    update: ({ req: { user } }) => isVolunteerOrAbove(user),
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
        position: "sidebar",
      },
    },
    {
      name: "tryout",
      type: "relationship",
      relationTo: "tryouts",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
      },
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
      type: "row",
      fields: [
        subtestFields[0],
        subtestFields[1],
      ],
    },
    {
      type: "row",
      fields: [
        subtestFields[2],
        subtestFields[3],
      ],
    },
    {
      type: "row",
      fields: [
        subtestFields[4],
        subtestFields[5],
      ],
    },
    {
      type: "row",
      fields: [
        subtestFields[6],
      ],
    },
    {
      name: "finalScore",
      type: "number",
      label: "Skor Akhir",
      required: true,
      min: 0,
      max: 1000,
      admin: {
        position: "sidebar",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create" && data.user) {
          try {
            const userId = typeof data.user === "object" ? data.user.id : data.user;
            const user = await req.payload.findByID({
              collection: "users",
              id: userId,
            });
            if (user) {
              data.accountType = user.accountType || resolveAccountType();
            }
          } catch (error) {
            console.error("Error setting accountType for score:", error);
          }
        }
        return data;
      },
    ],
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data?.user || !data?.tryout || !req.payload) return data;
        if (operation !== "create") return data;

        const userId = typeof data.user === "object" ? data.user.id : data.user;
        const tryoutId = typeof data.tryout === "object" ? data.tryout.id : data.tryout;

        const existing = await req.payload.find({
          collection: "tryout-scores",
          where: {
            and: [
              { user: { equals: userId } },
              { tryout: { equals: tryoutId } },
            ],
          },
          limit: 1,
        });

        if (existing.totalDocs > 0) {
          throw new Error("Score record already exists for this user and batch");
        }

        return data;
      },
    ],
  },
};
