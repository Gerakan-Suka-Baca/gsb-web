import type { CollectionConfig } from 'payload';
import { isAdminOrAbove } from '../accessHelpers';

export const ExplanationMedia: CollectionConfig = {
  slug: 'explanation-media',
  labels: {
    singular: 'Explanation PDF',
    plural: 'Explanation PDFs',
  },
  admin: {
    group: 'Media',
    description: 'File PDF pembahasan tryout.',
  },
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
      label: 'Nama File / Deskripsi',
    },
  ],
  upload: {
    staticDir: 'explanation-media',
    mimeTypes: ['application/pdf'],
  },
};
