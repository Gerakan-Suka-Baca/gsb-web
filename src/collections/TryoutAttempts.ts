import type { CollectionConfig } from "payload";
import { CompactJSON } from "@/components/payload/CompactJSON";

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
      admin: {
        components: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Field: CompactJSON as any,
        },
      },
    },
    {
      name: "flags",
      type: "json",
      defaultValue: {},
      admin: {
        components: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Field: CompactJSON as any,
        },
      },
    },
    {
      name: "questionResults",
      type: "json",
      label: "Hasil Per Soal",
      admin: {
        description: "Detail jawaban per soal: huruf jawaban, benar/salah, dll.",
        components: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Field: CompactJSON as any,
        },
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
      name: "subtestTimingData",
      type: "json",
      label: "Data Waktu Per Subtes",
      admin: {
        description: "Data timing per subtest: startedAt, endedAt, durationAllocated, timeSpent, timeRemaining.",
        components: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Field: CompactJSON as any,
        },
      },
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
