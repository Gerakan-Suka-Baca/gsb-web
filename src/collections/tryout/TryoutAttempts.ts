import type { CollectionConfig } from "payload";
import { isAdminOrAbove } from "../accessHelpers";

const resolveAccountType = () =>
  (process.env.APP_ENV || "").toLowerCase() === "development"
    ? "development"
    : "production";

export const TryoutAttempts: CollectionConfig = {
  slug: "tryout-attempts",
  access: {
    read: ({ req: { user } }) => isAdminOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  admin: {
    useAsTitle: "displayTitle",
    group: "Tryout",
    listSearchableFields: ["displayTitle"],
    defaultColumns: ["displayTitle", "tryout", "status", "resultPlan", "score", "correctAnswersCount", "totalQuestionsCount", "createdAt"],
  },
  fields: [
    {
      name: "displayTitle",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Auto-generated: Nama User — Nama Tryout",
      },
    },
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
      name: "answers",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
    },
    {
      name: "flags",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
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
      name: "allowRetake",
      type: "checkbox",
      label: "Allow Retake",
      defaultValue: false,
    },
    {
      name: "retakeStatus",
      type: "select",
      options: [
        { label: "Idle", value: "idle" },
        { label: "Running", value: "running" },
        { label: "Completed", value: "completed" },
      ],
      defaultValue: "idle",
      admin: { description: "Status retake tanpa mengubah status utama." },
    },
    {
      name: "maxRetake",
      type: "number",
      label: "Max Retake",
      defaultValue: 1,
      admin: { description: "Batas maksimal retake untuk attempt ini." },
    },
    {
      name: "retakeCount",
      type: "number",
      label: "Jumlah Retake",
      defaultValue: 0,
      admin: { description: "Total retake yang sudah dimulai." },
    },
    {
      name: "startedAt",
      type: "date",
      defaultValue: () => new Date(),
    },
    {
      name: "retakeStartedAt",
      type: "date",
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
      name: "retakeSubtestStartedAt",
      type: "date",
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
      name: "retakeSubtestDeadlineAt",
      type: "date",
    },
    {
      name: "completedAt",
      type: "date",
    },
    {
      name: "retakeCompletedAt",
      type: "date",
    },
    {
      name: "currentSubtest",
      type: "number",
      defaultValue: 0,
      admin: { description: "Index of the currently active subtest (0-based)." },
    },
    {
      name: "retakeCurrentSubtest",
      type: "number",
      defaultValue: 0,
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
      name: "heartbeatAt",
      type: "date",
      admin: { description: "Last server heartbeat time for this attempt." },
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
      name: "retakeCurrentQuestionIndex",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "processedBatchIds",
      type: "json",
      defaultValue: [],
      admin: { hidden: true },
    },
    {
      name: "retakeProcessedBatchIds",
      type: "json",
      defaultValue: [],
      admin: { hidden: true },
    },
    {
      name: "eventRevisions",
      type: "json",
      defaultValue: {},
      admin: { description: "Latest applied revision per event key.", hidden: true },
    },
    {
      name: "retakeEventRevisions",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
    },
    {
      name: "subtestStates",
      type: "json",
      defaultValue: {},
      admin: { description: "Subtest state map (idle/running/finished).", hidden: true },
    },
    {
      name: "retakeSubtestStates",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
    },
    {
      name: "subtestSnapshots",
      type: "array",
      admin: { initCollapsed: true, hidden: true },
      fields: [
        { name: "subtestId", type: "text", required: true },
        { name: "capturedAt", type: "date", required: true },
        { name: "answers", type: "json" },
        { name: "flags", type: "json" },
        { name: "source", type: "text" },
      ],
    },
    {
      name: "retakeSubtestSnapshots",
      type: "array",
      admin: { initCollapsed: true, hidden: true },
      fields: [
        { name: "subtestId", type: "text", required: true },
        { name: "capturedAt", type: "date", required: true },
        { name: "answers", type: "json" },
        { name: "flags", type: "json" },
        { name: "source", type: "text" },
      ],
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
      admin: { description: "Elapsed time (seconds) per subtest, mapped by subtestId.", hidden: true }
    },
    {
      name: "retakeSubtestDurations",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
    },
    {
      name: "retakeAnswers",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
    },
    {
      name: "retakeFlags",
      type: "json",
      defaultValue: {},
      admin: { hidden: true },
    },
    {
      name: "retakeSecondsRemaining",
      type: "number",
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
  ],
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        // Dynamically compute displayTitle on every read — no save needed
        try {
          const userRaw = doc.user;
          const tryoutRaw = doc.tryout;

          // If populated (object), extract directly. If ID string, fetch.
          let userName = "Unknown";
          if (typeof userRaw === "object" && userRaw !== null) {
            userName = userRaw.fullName || userRaw.username || userRaw.email || userRaw.id || "Unknown";
          } else if (typeof userRaw === "string") {
            try {
              const userDoc = await req.payload.findByID({ collection: "users", id: userRaw, depth: 0 });
              const u = userDoc as unknown as Record<string, unknown>;
              userName = (u.fullName || u.username || u.email || userRaw) as string;
            } catch { /* use ID fallback */ userName = userRaw; }
          }

          let tryoutTitle = "Tryout";
          if (typeof tryoutRaw === "object" && tryoutRaw !== null) {
            tryoutTitle = (tryoutRaw as Record<string, unknown>).title as string || tryoutRaw.id || "Tryout";
          } else if (typeof tryoutRaw === "string") {
            try {
              const tryoutDoc = await req.payload.findByID({ collection: "tryouts", id: tryoutRaw, depth: 0 });
              tryoutTitle = (tryoutDoc as unknown as Record<string, unknown>).title as string || tryoutRaw;
            } catch { tryoutTitle = tryoutRaw; }
          }

          doc.displayTitle = `${userName} — ${tryoutTitle}`;
        } catch {
          // Fallback: keep whatever was stored
        }
        return doc;
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create" && data?.user) {
          try {
            const userId = typeof data.user === "object" ? data.user.id : data.user;
            const user = await req.payload.findByID({ collection: "users", id: userId, depth: 0 });
            if (user) {
              data.accountType = (user as unknown as Record<string, unknown>).accountType || resolveAccountType();
            }
          } catch {
            data.accountType = resolveAccountType();
          }
        }
        return data;
      },
    ],
  },
};
