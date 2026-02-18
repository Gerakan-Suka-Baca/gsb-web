import type { CollectionConfig } from 'payload'
import { isVolunteerOrAbove } from './accessHelpers'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => isVolunteerOrAbove(user),
    update: ({ req: { user } }) => isVolunteerOrAbove(user),
    delete: ({ req: { user } }) => isVolunteerOrAbove(user),
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
