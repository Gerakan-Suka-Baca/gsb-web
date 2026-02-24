import { CollectionConfig } from 'payload'

export const Universities: CollectionConfig = {
  slug: 'universities',
  admin: {
    group: 'Universities',
    useAsTitle: 'name',
    defaultColumns: ['name', 'abbreviation', 'status', 'accreditation'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Universitas',
    },
    {
      name: 'abbreviation',
      type: 'text',
      label: 'Singkatan',
    },
    {
      name: 'npsn',
      type: 'text',
      label: 'NPSN',
    },
    {
      name: 'status',
      type: 'select',
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
      label: 'Akreditasi',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Alamat',
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
    }
  ],
}
