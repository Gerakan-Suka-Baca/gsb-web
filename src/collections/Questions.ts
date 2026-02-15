import type { CollectionConfig } from "payload";
import { TryoutQuestion } from "../blocks/tryoutQuestion";

export const Questions: CollectionConfig = {
  admin: {
    useAsTitle: "title",
  },
  slug: "questions",
  fields: [
    {
      name: "duration",
      label: "Duration (Minutes)",
      type: "number",
      required: true,
      defaultValue: 20,
      admin: {
        description: "Waktu pengerjaan untuk subtes ini dalam menit.",
      },
    },
    {
      name: "subtest",
      label: "Subtest Type",
      type: "select",
      required: false,
      options: [
        { label: "Penalaran Umum", value: "PU" },
        { label: "Pengetahuan Kuantitatif", value: "PK" },
        { label: "Penalaran Matematika", value: "PM" },
        { label: "Literasi Bahasa Inggris", value: "LBE" },
        { label: "Literasi Bahasa Indonesia", value: "LBI" },
        { label: "Pengetahuan Pemahaman Umum", value: "PPU" },
        { label: "Kemampuan Memahami Bacaan dan Menulis", value: "KMBM" },
      ],
    },
    {
      name: "tryout",
      label: "Batch / Tryout",
      type: "relationship",
      relationTo: "tryouts",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      type: "blocks",
      name: "tryoutQuestions",
      blocks: [TryoutQuestion],
    },
    {
      name: "active",
      type: "checkbox",
      required: true,
      defaultValue: true,
    },
  ],
};
