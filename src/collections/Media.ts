import type { CollectionConfig } from 'payload'
import { isAdminOrAbove } from './accessHelpers'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
