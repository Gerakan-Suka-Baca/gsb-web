import type { CollectionConfig } from "payload";
import { redisDel, redisScanDel } from "@/lib/redis";
import { clearTryoutCache } from "@/modules/tryouts/server/services/tryout-cache.service";
import { isVolunteerOrAbove } from "../accessHelpers";

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
        if (merged?.isPermanent === true) {
          if (!merged.dateOpen) {
            nextData.dateOpen = "2000-01-01T00:00:00.000Z";
          }
          if (!merged.dateClose) {
            nextData.dateClose = "2100-12-31T23:59:59.999Z";
          }
        }
        return nextData;
      },
    ],
    afterChange: [
      async ({ doc }) => {
        const tryoutId = typeof doc.id === "string" ? doc.id : null;
        clearTryoutCache(tryoutId ?? undefined);
        await redisScanDel("gsb:cache:tryouts:*");
        if (tryoutId) {
          await redisDel(`tryout:meta:${tryoutId}`);
          await redisDel(`tryout:full:${tryoutId}`);
        }
        return doc;
      },
    ],
    afterDelete: [
      async ({ id }) => {
        const tryoutId = typeof id === "string" ? id : null;
        clearTryoutCache(tryoutId ?? undefined);
        await redisScanDel("gsb:cache:tryouts:*");
        if (tryoutId) {
          await redisDel(`tryout:meta:${tryoutId}`);
          await redisDel(`tryout:full:${tryoutId}`);
        }
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
      name: "description",
      type: "textarea",
      admin: {
        description: "Short description shown on the tryout card",
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Banner image for tryout card (recommended: 800x400px)",
      },
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
      name: "isPermanent",
      type: "checkbox",
      label: "Permanent",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "dateOpen",
      type: "date",
      label: "Date Open",
      required: true,
      admin: {
        condition: (_, siblingData) => !siblingData?.isPermanent,
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "dd MMM yyyy HH:mm",
          timeFormat: "HH:mm",
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
        condition: (_, siblingData) => !siblingData?.isPermanent,
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "dd MMM yyyy HH:mm",
          timeFormat: "HH:mm",
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
          displayFormat: "dd MMM yyyy HH:mm",
          timeFormat: "HH:mm",
        },
        description: "When scores become visible to students. WIB (GMT+7)",
        position: "sidebar",
      },
    },
  ],
};
