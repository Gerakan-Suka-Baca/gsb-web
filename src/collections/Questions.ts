import type { CollectionConfig } from "payload";
import { TryoutQuestion } from "../blocks/tryoutQuestion";
import { isVolunteerOrAbove } from "./accessHelpers";
import { SUBTEST_OPTIONS } from "./subtestOptions";

export const Questions: CollectionConfig = {
  slug: "questions",
  admin: {
    useAsTitle: "title",
    group: "Tryout",
  },
  labels: {
    singular: "Tryout Question",
    plural: "Tryout Questions",
  },
  access: {
    read: ({ req: { user } }) => isVolunteerOrAbove(user),
    create: ({ req: { user } }) => isVolunteerOrAbove(user),
    update: ({ req: { user } }) => isVolunteerOrAbove(user),
    delete: ({ req: { user } }) => isVolunteerOrAbove(user),
  },
  fields: [
    {
      name: "duration",
      label: "Duration (Minutes)",
      type: "number",
      required: true,
      defaultValue: 20,
    },
    {
      name: "subtest",
      label: "Subtest Type",
      type: "select",
      required: false,
      options: [...SUBTEST_OPTIONS],
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
