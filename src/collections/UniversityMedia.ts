import type { CollectionConfig } from 'payload'
import { isAdminOrAbove } from './accessHelpers'

export const UniversityMedia: CollectionConfig = {
  slug: 'university-media',
  labels: {
    singular: 'University Media',
    plural: 'University Media',
  },
  admin: {
    group: 'Universities',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: 'Teks alternatif untuk aksesibilitas dan SEO.',
      }
    },
  ],
}
