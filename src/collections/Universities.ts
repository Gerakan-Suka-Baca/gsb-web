import { CollectionConfig } from 'payload'

const toSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

import { isVolunteerOrAbove } from './accessHelpers'

export const Universities: CollectionConfig = {
  slug: 'universities',
  admin: {
    group: 'Universities',
    useAsTitle: 'name',
    defaultColumns: ['name', 'abbreviation', 'status', 'accreditation'],
    pagination: {
      defaultLimit: 10,
      limits: [10, 20, 50],
    },
  },
  access: {
    read: ({ req: { user } }) => isVolunteerOrAbove(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const nextData = data ?? {}
        const merged = { ...(originalDoc ?? {}), ...(nextData ?? {}) }
        if (merged?.name && !merged.slugField) {
          nextData.slugField = toSlug(merged.name)
        }
        const docId = originalDoc?.id
        let programCount = 0
        let programsWithMetricsCount = 0
        if (docId && req.payload) {
          const progResult = await req.payload.find({
            collection: 'university-programs',
            where: { university: { equals: docId } },
            limit: 0,
            depth: 0,
          })
          programCount = progResult.totalDocs
          programsWithMetricsCount = programCount
        }
        let completenessScore = 0
        if (merged.name) completenessScore++
        if (merged.abbreviation) completenessScore++
        if (merged.accreditation) completenessScore++
        if (merged.address) completenessScore++
        if (merged.website) completenessScore++
        if (programCount > 0) completenessScore += 2
        if (programsWithMetricsCount > 0) completenessScore += 2
        nextData.programCount = programCount
        nextData.programsWithMetricsCount = programsWithMetricsCount
        nextData.completenessScore = completenessScore
        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      label: 'Nama Universitas',
    },
    {
      name: 'slugField',
      type: 'text',
      index: true,
      unique: true,
      label: 'Slug (URL)',
      admin: {
        description: 'Otomatis di-generate dari nama. Bisa diedit manual.',
      },
    },
    {
      name: 'abbreviation',
      type: 'text',
      index: true,
      label: 'Singkatan',
    },
    {
      name: 'npsn',
      type: 'text',
      index: true,
      label: 'NPSN',
    },
    {
      name: 'status',
      type: 'select',
      index: true,
      options: [
        { label: 'Negeri', value: 'negeri' },
        { label: 'Swasta', value: 'swasta' },
        { label: 'PTK', value: 'ptk' },
      ],
      label: 'Status Perguruan Tinggi',
    },
    {
      name: 'accreditation',
      type: 'text',
      index: true,
      label: 'Akreditasi',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Jalan',
    },
    {
      name: 'district',
      type: 'text',
      label: 'Kecamatan / Distrik',
    },
    {
      name: 'city',
      type: 'text',
      index: true,
      label: 'Kota / Kabupaten',
    },
    {
      name: 'province',
      type: 'text',
      index: true,
      label: 'Provinsi',
    },
    {
      name: 'website',
      type: 'text',
      label: 'Website',
    },
    {
      name: 'pddiktiId',
      type: 'text',
      label: 'ID PDDikti (id_sp)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'university-media',
      label: 'Logo Kampus (Bentuk Persegi/Bulat)',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'university-media',
      label: 'Foto Universitas (Bentuk Landscape/Banner)',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Deskripsi Universitas',
    },
    {
      name: 'visionMission',
      type: 'richText',
      label: 'Visi Misi Universitas',
    },
    {
      name: 'programCount',
      type: 'number',
      index: true,
      label: 'Total Program Studi',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'programsWithMetricsCount',
      type: 'number',
      index: true,
      label: 'Program dengan Metrik',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'completenessScore',
      type: 'number',
      index: true,
      label: 'Skor Kelengkapan',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'programList',
      type: 'join',
      collection: 'university-programs',
      on: 'university',
      label: 'Daftar Program Studi',
      admin: {
        description: 'Program studi yang terhubung dengan universitas ini (dari koleksi University Programs).',
      },
    }
  ],
}
