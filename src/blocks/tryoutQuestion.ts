import { Block } from "payload";
import { TryoutAnswer } from "./tryoutAnswer";

export const TryoutQuestion: Block = {
  slug: "tryoutQuestion",
  labels: {
    singular: "Tryout Question",
    plural: "Tryout Questions",
  },
  fields: [
    {
      name: "question",
      type: "richText",
      required: true,
    },
    {
      type: "blocks",
      name: "tryoutAnswers",
      blocks: [TryoutAnswer],
      minRows: 1,
      maxRows: 5,
      required: true,
    },
  ],
};
