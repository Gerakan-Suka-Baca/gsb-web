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

export const TryoutAttempts: CollectionConfig = {
  slug: "tryout-attempts",
  access: {
    read: ({ req: { user } }) => {
      if (hasAdminRole(user)) {
        return true;
      }
      if (user) {
        return { user: { equals: user.id } };
      }
      return false;
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasAdminRole(user),
  },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "tryout", "status", "resultPlan", "score", "correctAnswersCount", "totalQuestionsCount", "createdAt"],
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
      type: "array",
      label: "Hasil Per Soal",
      admin: { initCollapsed: true },
      fields: [
        { name: "subtestId", type: "text", required: true },
        { name: "questionId", type: "text", required: true },
        { name: "questionNumber", type: "number", required: true },
        { name: "selectedLetter", type: "text" },
        { name: "correctLetter", type: "text" },
        { name: "isCorrect", type: "checkbox", defaultValue: false },
      ],
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
      name: "subtestStartedAt",
      type: "date",
      admin: {
        description:
          "Timestamp authoritative server saat subtes aktif mulai berjalan.",
      },
    },
    {
      name: "subtestDeadlineAt",
      type: "date",
      admin: {
        description:
          "Deadline authoritative server untuk subtes aktif saat ini.",
      },
    },
    {
      name: "completedAt",
      type: "date",
    },
    {
      name: "currentSubtest",
      type: "number",
      defaultValue: 0,
      admin: { description: "Index subtes yang sedang dikerjakan (0-based)." },
    },
    {
      name: "examState",
      type: "select",
      options: [
        { label: "Running", value: "running" },
        { label: "Bridging", value: "bridging" },
      ],
      defaultValue: "running",
      admin: { description: "State internal ujian (pengerjaan vs istirahat antar subtes)." },
    },
    {
      name: "bridgingExpiry",
      type: "date",
      admin: { description: "Waktu berakhirnya bridging (jika sedang bridging)." },
    },
    {
      name: "secondsRemaining",
      type: "number",
      admin: { description: "Sisa waktu (detik) saat penyimpanan terakhir." },
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
    {
      name: "currentQuestionIndex",
      type: "number",
      defaultValue: 0,
      admin: { description: "Index soal yang sedang dikerjakan di subtes saat ini (0-based)." },
    },
    {
      name: "processedBatchIds",
      type: "json",
      defaultValue: [],
    },
    {
      name: "resultPlan",
      type: "select",
      label: "Paket Hasil",
      options: [
        { label: "Belum Dipilih", value: "none" },
        { label: "Gratis", value: "free" },
        { label: "Berbayar", value: "paid" },
      ],
      defaultValue: "none",
      admin: { description: "Paket hasil tryout yang dipilih peserta." },
    },
  ],
};
