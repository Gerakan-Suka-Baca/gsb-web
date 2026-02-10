import type { CollectionConfig } from "payload";

export const Tryouts: CollectionConfig = {
  slug: "tryouts",
  auth: {
    useAPIKey: true,
    disableLocalStrategy: true,
  },
  admin: {
    listSearchableFields: ["title"],
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "Date Open",
      type: "date",
      required: true,
      timezone: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d MMM yyy h:mm:ss a",
        },
      },
    },
    {
      name: "Date Close",
      type: "date",
      required: true,
      timezone: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d MMM yyy h:mm:ss a",
        },
      },
    },
    {
      name: "description",
      type: "text",
      required: true,
    },
    {
      name: "questions",
      type: "relationship",
      relationTo: "questions",
      hasMany: true,
      required: true,
      admin: {
        position: "sidebar",
        isSortable: true,
      },
    },
  ],
};
