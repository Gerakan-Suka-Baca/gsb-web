import type { CollectionConfig } from 'payload';
import { isAdminOrAbove } from './accessHelpers';

export const TryoutExplanations: CollectionConfig = {
  slug: 'tryout-explanations',
  admin: {
    useAsTitle: 'title',
    group: 'Tryout',
    description: 'Pembahasan Tryout dalam bentuk file PDF.',
  },
  access: {
    read: () => true, 
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Judul Pembahasan',
      admin: {
        description: 'Name of the explanation document.',
      }
    },
    {
      name: 'tryout',
      type: 'relationship',
      relationTo: 'tryouts',
      required: true,
      index: true,
      label: 'Tryout',
      admin: {
        description: 'Select the Tryout batch this explanation belongs to.',
      }
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'File PDF Pembahasan',
      admin: {
        description: 'Upload the PDF file containing the explanations.',
      },
      filterOptions: {
        mimeType: { contains: 'application/pdf' },
      }
    },
  ],
};
