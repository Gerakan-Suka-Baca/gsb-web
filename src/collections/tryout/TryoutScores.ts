import type { CollectionConfig } from "payload";
import { isVolunteerOrAbove, isAdminOrAbove } from "../accessHelpers";
import { SUBTEST_OPTIONS } from "../subtestOptions";
import { clearMentorDashboardCache } from "@/modules/mentor-dashboard/server/services/mentor-dashboard-cache.service";

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
      name: "attempt",
      type: "relationship",
      relationTo: "tryout-attempts",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
        condition: (data) => !data?.id,
      },
      filterOptions: {
        status: { equals: "completed" },
      },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
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
        readOnly: true,
      },
    },
    {
      name: "paymentType",
      type: "select",
      label: "Tipe Pembayaran",
      required: true,
      defaultValue: "free",
      options: [
        { label: "Gratis", value: "free" },
        { label: "Berbayar", value: "paid" },
      ],
      admin: {
        position: "sidebar",
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
    beforeChange: [],
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== "create") return data;

        if (data?.attempt && req.payload) {
          const attemptId = typeof data.attempt === "object" ? data.attempt.id : data.attempt;
          const attemptData = await req.payload.findByID({
            collection: "tryout-attempts",
            id: attemptId,
            depth: 0,
          });

          if (attemptData) {
            data.user = typeof attemptData.user === "object" ? attemptData.user.id : attemptData.user;
            data.tryout = typeof attemptData.tryout === "object" ? attemptData.tryout.id : attemptData.tryout;
          }
        }

        if (!data?.user || !data?.tryout || !req.payload) return data;

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
    afterChange: [
      async () => {
        await clearMentorDashboardCache();
      },
    ],
    afterDelete: [
      async () => {
        await clearMentorDashboardCache();
      },
    ],
  },
};
