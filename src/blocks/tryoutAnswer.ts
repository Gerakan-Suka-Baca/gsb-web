import { Block } from "payload";

export const TryoutAnswer: Block = {
  slug: "tryoutAnswer",
  labels: {
    singular: "Tryout Answer",
    plural: "Tryout Answers",
  },
  fields: [
    {
      name: "answer",
      type: "richText",
      required: true,
    },
    {
      name: "isCorrect",
      type: "checkbox",
      required: true,
    },
  ],
};
