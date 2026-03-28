import type { GlobalConfig } from "payload";
import { isAdminOrAbove } from "../accessHelpers";

export const AppSettings: GlobalConfig = {
  slug: "app-settings",
  label: "App Settings",
  admin: {
    group: "System",
    description: "Global configuration for algorithms, recommendations, and UI limits.",
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Algoritma Peluang Lulus",
          description: "Pengaturan batas probabilitas kalkukasi (calculateChance).",
          fields: [
            {
              name: "chanceAlgorithmK",
              type: "number",
              label: "K-Factor (Kecepatan kurva)",
              defaultValue: 0.05,
              required: true,
              admin: { step: 0.01 },
            },
            {
              name: "chanceMinPercentage",
              type: "number",
              label: "Persentase Peluang Minimum (%)",
              defaultValue: 5,
              required: true,
              min: 0,
              max: 100,
            },
            {
              name: "chanceMaxPercentage",
              type: "number",
              label: "Persentase Peluang Maksimum (%)",
              defaultValue: 95,
              required: true,
              min: 0,
              max: 100,
            },
          ],
        },
        {
          label: "Rekomendasi Universitas",
          description: "Pengaturan batas rekomendasi dan analisis target.",
          fields: [
            {
              name: "recommendationMaxResults",
              type: "number",
              label: "Maksimal Rekomendasi per Siswa",
              defaultValue: 20,
              required: true,
              min: 1,
              max: 100,
            },
            {
              name: "recommendationMinChance",
              type: "number",
              label: "Peluang Minimal Masuk Rekomendasi (%)",
              defaultValue: 70,
              required: true,
              min: 1,
              max: 100,
            },
            {
              name: "targetAnalysisSafeThreshold",
              type: "number",
              label: "Batas Peluang Status 'Aman' (%)",
              defaultValue: 70,
              required: true,
              min: 1,
              max: 100,
            },
            {
              name: "targetAnalysisVerySafeThreshold",
              type: "number",
              label: "Batas Peluang Status 'Sangat Aman' (%)",
              defaultValue: 85,
              required: true,
              min: 1,
              max: 100,
            },
            {
              name: "targetAnalysisCompetitiveThreshold",
              type: "number",
              label: "Batas Peluang Status 'Kompetitif' (%)",
              defaultValue: 50,
              required: true,
              min: 1,
              max: 100,
            },
            {
              name: "universitySearchLimit",
              type: "number",
              label: "Batas Pencarian Internal Server",
              defaultValue: 300,
              required: true,
              min: 50,
              max: 1000,
            },
          ],
        },
        {
          label: "Akses & Tampilan",
          description: "Pengaturan akses fitur (Bypass) dan tampilan UI.",
          fields: [
            {
              name: "bypassExplanationAccess",
              type: "checkbox",
              label: "Bypass Akses Pembahasan",
              defaultValue: false,
              admin: {
                description: "Jika TRUE, semua siswa bisa melihat Pembahasan tanpa perlu membayar akses VIP.",
              },
            },
            {
              name: "universityListPerPage",
              type: "number",
              label: "Universitas Per Halaman",
              defaultValue: 12,
              required: true,
              min: 1,
              max: 50,
            },
          ],
        },
      ],
    },
  ],
};
