import type { CollectionConfig } from "payload";
import { isVolunteerOrAbove } from "./accessHelpers";

const toSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const Tryouts: CollectionConfig = {
  slug: "tryouts",
  admin: {
    listSearchableFields: ["title"],
    useAsTitle: "title",
    group: "Tryout",
  },
  labels: {
    singular: "Batch Tryout",
    plural: "Batch Tryout",
  },
  access: {
    read: ({ req: { user } }) => isVolunteerOrAbove(user),
    create: ({ req: { user } }) => isVolunteerOrAbove(user),
    update: ({ req: { user } }) => isVolunteerOrAbove(user),
    delete: ({ req: { user } }) => isVolunteerOrAbove(user),
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const nextData = data ?? {};
        const merged = { ...(originalDoc ?? {}), ...(nextData ?? {}) };
        if (merged?.title && !merged.slugField) {
          nextData.slugField = toSlug(merged.title);
        }
        return nextData;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slugField",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Auto-generated from title if empty",
      },
    },
    {
      name: "dateOpen",
      type: "date",
      label: "Date Open",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d MMM yyy HH:mm",
        },
        description: "WIB (GMT+7)",
      },
    },
    {
      name: "dateClose",
      type: "date",
      label: "Date Close",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d MMM yyy HH:mm",
        },
        description: "WIB (GMT+7)",
      },
    },
    {
      name: "scoreReleaseDate",
      type: "date",
      label: "Score Release Date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d MMM yyy HH:mm",
        },
        description: "When scores become visible to students. WIB (GMT+7)",
        position: "sidebar",
      },
    },
  ],
};
