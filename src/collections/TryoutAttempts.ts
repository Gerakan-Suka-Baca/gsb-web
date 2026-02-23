import type { CollectionConfig } from "payload";
import { isAdminOrAbove } from "./accessHelpers";

export const TryoutAttempts: CollectionConfig = {
  slug: "tryout-attempts",
  access: {
    read: ({ req: { user } }) => isAdminOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  admin: {
    useAsTitle: "id",
    group: "Tryout",
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
          "Authoritative server timestamp when the active subtest started.",
      },
    },
    {
      name: "subtestDeadlineAt",
      type: "date",
      admin: {
        description:
          "Authoritative server deadline for the current active subtest.",
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
      admin: { description: "Index of the currently active subtest (0-based)." },
    },
    {
      name: "examState",
      type: "select",
      options: [
        { label: "Running", value: "running" },
        { label: "Bridging", value: "bridging" },
      ],
      defaultValue: "running",
      admin: { description: "Internal exam state (running vs bridging)." },
    },
    {
      name: "bridgingExpiry",
      type: "date",
      admin: { description: "Bridging expiry time (if currently bridging)." },
    },
    {
      name: "secondsRemaining",
      type: "number",
      admin: { description: "Remaining seconds at last backup." },
    },
    {
      name: "score",
      type: "number",
      label: "Skor (%)",
      admin: { description: "Percentage of correct answers." },
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
      admin: { description: "Index of the current question in the active subtest (0-based)." },
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
      admin: { description: "Selected tryout result plan." },
    },
    {
      name: "subtestDurations",
      type: "json",
      defaultValue: {},
      admin: { description: "Elapsed time (seconds) per subtest, mapped by subtestId." }
    },
  ],
};
