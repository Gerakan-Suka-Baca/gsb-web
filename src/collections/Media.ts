import type { CollectionConfig } from 'payload'
import { isAdminOrAbove } from './accessHelpers'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Question Media',
    plural: 'Question Media',
  },
  admin: {
    group: 'Tryout',
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
      label: 'Alt Text / Deskripsi Gambar',
    },
    {
      name: 'relatedTryout',
      type: 'relationship',
      relationTo: 'tryouts',
      admin: {
        position: 'sidebar',
        description: 'Terkait dengan Batch Tryout (Opsional)'
      }
    },
    {
      name: 'relatedSubtest',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'ID atau Nama Subtest Terkait (Opsional)'
      }
    },
    {
      name: 'relatedQuestionNumber',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Nomor Soal Terkait (Opsional)'
      }
    }
  ],
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      }
    ],
    formatOptions: {
      format: 'webp',
      options: {
        quality: 75,
      }
    }
  },
}
