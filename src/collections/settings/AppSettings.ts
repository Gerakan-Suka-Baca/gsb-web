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
          description: "Pengaturan untuk perhitungan probabilitas (calculateChance).",
          fields: [
            {
              name: "chanceAlgorithmK",
              type: "number",
              label: "K-Factor (Kecepatan kurva)",
              defaultValue: 0.05,
              required: true,
              admin: {
                step: 0.01,
                description: "Nilai default: 0.05. Semakin besar, kurva probabilitas semakin curam terhadap selisih skor.",
              },
            },
            {
              name: "chanceMinPercentage",
              type: "number",
              label: "Persentase Peluang Minimum (%)",
              defaultValue: 5,
              required: true,
              min: 0,
              max: 100,
              admin: {
                description: "Peluang terendah yang mungkin didapatkan (bottom clamp). Default: 5%.",
              },
            },
            {
              name: "chanceMaxPercentage",
              type: "number",
              label: "Persentase Peluang Maksimum (%)",
              defaultValue: 95,
              required: true,
              min: 0,
              max: 100,
              admin: {
                description: "Peluang tertinggi yang mungkin didapatkan (top clamp). Default: 95%.",
              },
            },
          ],
        },
        {
          label: "Rekomendasi Universitas",
          description: "Pengaturan untuk halaman rekomendasi dan analisis target.",
          fields: [
            {
              name: "recommendationMaxResults",
              type: "number",
              label: "Maksimal Rekomendasi per Siswa",
              defaultValue: 20,
              required: true,
              min: 1,
              max: 100,
              admin: {
                description: "Jumlah maksimum kampus yang ditampilkan di hasil rekomendasi.",
              },
            },
            {
              name: "recommendationMinChance",
              type: "number",
              label: "Peluang Minimal Masuk Rekomendasi (%)",
              defaultValue: 70,
              required: true,
              min: 1,
              max: 100,
              admin: {
                description: "Batas bawah peluang agar sebuah kampus direkomendasikan.",
              },
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
              admin: {
                description: "Jumlah maksimum program studi yang di-scan oleh algoritma sebelum disaring.",
              },
            },
          ],
        },
        {
          label: "Tampilan (UI/UX)",
          description: "Pengaturan batas dan pagination antarmuka pengguna.",
          fields: [
            {
              name: "universityListPerPage",
              type: "number",
              label: "Universitas Per Halaman",
              defaultValue: 12,
              required: true,
              min: 1,
              max: 50,
              admin: {
                description: "Jumlah universitas yang ditampilkan per halaman pada menu /universitas.",
              },
            },
          ],
        },
      ],
    },
  ],
};
