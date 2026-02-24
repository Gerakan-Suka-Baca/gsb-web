import { CollectionConfig } from 'payload'

export const StudyPrograms: CollectionConfig = {
  slug: 'studyPrograms',
  admin: {
    group: "Universities",
    useAsTitle: 'name',
    defaultColumns: ['name', 'university', 'category', 'level'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Program Studi',
    },
    {
      name: 'university',
      type: 'relationship',
      relationTo: 'universities',
      required: true,
      label: 'Universitas',
    },
    {
      name: 'level',
      type: 'text',
      label: 'Jenjang (Contoh: S1, D4, dll)',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'SNBP', value: 'snbp' },
        { label: 'SNBT', value: 'snbt' },
        { label: 'Mandiri', value: 'mandiri' },
      ],
      label: 'Kategori Penerimaan',
    },
    {
      name: 'accreditation',
      type: 'text',
      label: 'Akreditasi',
    },
    {
      name: 'capacity',
      type: 'number',
      label: 'Daya Tampung Saat Ini',
    },
    {
      name: 'applicantsPreviousYear',
      type: 'number',
      label: 'Pendaftar Tahun Sebelumnya',
    },
    {
      name: 'baseValue',
      type: 'number',
      label: 'Base Value (Keketatan)',
    },
    {
      name: 'predictedApplicants',
      type: 'number',
      label: 'Prediksi Pendaftar',
    },
    {
      name: 'avgUkt',
      type: 'text',
      label: 'Rata-rata UKT',
    },
    {
      name: 'maxUkt',
      type: 'text',
      label: 'UKT Maksimal',
    },
    {
      name: 'admissionMetric',
      type: 'text',
      label: 'Metrik Kelulusan',
      admin: {
        description: 'Nilai Rapor untuk SNBP, atau Survey/Prediksi UTBK untuk SNBT',
      },
    },
    {
      name: 'passingPercentage',
      type: 'text',
      label: 'Persentase Kelulusan',
    },
    {
      name: 'history',
      type: 'json',
      label: 'Data Historis Daya Tampung & Pendaftar',
    },
    {
      name: 'pddiktiId',
      type: 'text',
      label: 'ID PDDikti (id_prodi/id_sms)',
      admin: {
        description: 'Internal ID used for PDDikti synchronisation',
      },
    }
  ],
}
