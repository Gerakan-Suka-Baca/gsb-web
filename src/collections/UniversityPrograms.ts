import type { CollectionConfig } from "payload";
import { isAdminOrAbove, isVolunteerOrAbove } from "./accessHelpers";

export const UniversityPrograms: CollectionConfig = {
  slug: "university-programs",
  admin: {
    group: "Universities",
    useAsTitle: "name",
    defaultColumns: ["university", "name", "category", "level", "accreditation"],
    description:
      "Program studi per-universitas. Data ini di-generate dari field `programs` lama untuk meringankan dokumen universitas.",
  },
  access: {
    read: ({ req: { user } }) => isVolunteerOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: "university",
      type: "relationship",
      relationTo: "universities",
      required: true,
      index: true,
      label: "Universitas",
    },
    {
      name: "universityName",
      type: "text",
      index: true,
      label: "Nama Universitas",
    },
    {
      name: "abbreviation",
      type: "text",
      label: "Singkatan Universitas",
    },
    {
      name: "status",
      type: "text",
      label: "Status Universitas",
    },
    {
      name: "universityAccreditation",
      type: "text",
      label: "Akreditasi Universitas",
    },
    {
      name: "name",
      type: "text",
      required: true,
      index: true,
      label: "Nama Program Studi",
    },
    {
      name: "faculty",
      type: "text",
      label: "Fakultas",
    },
    {
      name: "level",
      type: "text",
      label: "Jenjang",
    },
    {
      name: "category",
      type: "select",
      options: [
        { label: "SNBT", value: "snbt" },
        { label: "SNBP", value: "snbp" },
        { label: "Mandiri", value: "mandiri" },
      ],
      label: "Kategori Seleksi",
    },
    {
      name: "accreditation",
      type: "text",
      label: "Akreditasi Program Studi",
    },
    {
      name: "metrics",
      type: "array",
      label: "Metrik Per Tahun",
      admin: {
        description: "Diisi otomatis dari data scraping. Boleh dikosongkan untuk input manual.",
        initCollapsed: true,
      },
      fields: [
        {
          name: "year",
          type: "text",
          label: "Tahun",
        },
        {
          name: "capacity",
          type: "number",
          label: "Kapasitas",
        },
        {
          name: "applicants",
          type: "number",
          label: "Pendaftar",
        },
        {
          name: "passingPercentage",
          type: "text",
          label: "Persentase Lolos",
        },
        {
          name: "predictedApplicants",
          type: "number",
          label: "Perkiraan Pendaftar",
        },
        {
          name: "admissionMetric",
          type: "text",
          label: "Passing Grade (Skor Masuk)",
        },
        {
          name: "avgUkt",
          type: "text",
          label: "Rata-rata UKT",
        },
        {
          name: "maxUkt",
          type: "text",
          label: "Maksimal UKT",
        },
      ],
    },
    {
      name: "legacyProgramId",
      type: "text",
      label: "Legacy Program ID (dari array programs lama)",
      unique: true,
      admin: {
        readOnly: true,
        description: "Dipakai untuk migrasi dan menjaga referensi dari data lama.",
      },
    },
  ],
};

