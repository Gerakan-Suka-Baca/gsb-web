import type { CollectionConfig } from "payload";

export const Tests: CollectionConfig = {
  admin: {
    useAsTitle: "title",
  },
  slug: "tests",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
      admin: {
        description: "Microsoft Quiz URL",
      },
    },
    {
      name: "active",
      type: "checkbox",
      required: true,
    },
  ],
};
