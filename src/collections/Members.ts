import type { CollectionConfig } from "payload";

export const Members: CollectionConfig = {
  admin: {
    useAsTitle: "name",
  },
  slug: "members",
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "year",
      type: "text",
      required: true,
      admin: {
        description: "Format: YYYY",
      },
    },
    {
      name: "division",
      type: "select",
      required: true,
      options: ["BPH", "Medkom", "Humas", "Litbang", "Advokasi"],
    },
    {
      name: "position",
      type: "select",
      required: true,
      options: [
        "Ketua",
        "Wakil Ketua",
        "Sekretaris",
        "Bendahara",
        "Koordinator",
        "Wakil Koordinator",
        "Anggota",
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
  ], 
};
