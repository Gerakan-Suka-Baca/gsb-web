
import type { CollectionConfig } from "payload";

export const TryoutAttempts: CollectionConfig = {
  slug: "tryout-attempts",
  access: {
    read: ({ req: { user } }) => {
      if (user && "roles" in user && (user.roles?.includes("admin") || user.roles?.includes("super-admin"))) {
        return true;
      }
      if (user) {
        return { user: { equals: user.id } };
      }
      return false;
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => {
      return Boolean(
        user && "roles" in user && (user.roles?.includes("admin") || user.roles?.includes("super-admin"))
      );
    },
  },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "tryout", "status", "score", "correctAnswersCount", "totalQuestionsCount", "createdAt"],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "tryout",
      type: "relationship",
      relationTo: "tryouts",
      required: true,
      index: true,
    },
    {
      name: "answers",
      type: "json",
      defaultValue: {},
    },
    {
      name: "flags",
      type: "json",
      defaultValue: {},
    },
    {
      name: "questionResults",
      type: "json",
      label: "Hasil Per Soal",
      admin: {
        description: "Detail jawaban per soal: huruf jawaban, benar/salah, dll.",
      },
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Started", value: "started" },
        { label: "Completed", value: "completed" },
      ],
      defaultValue: "started",
      required: true,
      index: true,
    },
    {
      name: "startedAt",
      type: "date",
      defaultValue: () => new Date(),
    },
    {
      name: "completedAt",
      type: "date",
    },
    {
      name: "score",
      type: "number",
      label: "Skor (%)",
      admin: { description: "Persentase jawaban benar." },
    },
    {
      name: "correctAnswersCount",
      type: "number",
      label: "Jawaban Benar",
    },
    {
      name: "totalQuestionsCount",
      type: "number",
      label: "Total Soal",
    },
  ],
};
