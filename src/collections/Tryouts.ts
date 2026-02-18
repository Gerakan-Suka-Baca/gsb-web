import type { CollectionConfig } from "payload";
import { isVolunteerOrAbove } from "./accessHelpers";

export const Tryouts: CollectionConfig = {
  slug: "tryouts",
  admin: {
    listSearchableFields: ["title"],
    useAsTitle: "title",
  },
  access: {
    read: ({ req: { user } }) => isVolunteerOrAbove(user),
    create: ({ req: { user } }) => isVolunteerOrAbove(user),
    update: ({ req: { user } }) => isVolunteerOrAbove(user),
    delete: ({ req: { user } }) => isVolunteerOrAbove(user),
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
  ],
};
