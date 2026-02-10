import type { CollectionConfig } from "payload";
import { TryoutQuestion } from "../blocks/tryoutQuestion";

export const Questions: CollectionConfig = {
  admin: {
    useAsTitle: "title",
  },
  slug: "questions",
  fields: [
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
    },
  ],
};
