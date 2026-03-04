import { CollectionConfig } from 'payload'
import formatSlug from '../utils/formatSlug'

export const ArticleLabels: CollectionConfig = {
  slug: 'article-labels',
  admin: {
    useAsTitle: 'name',
    group: 'Blogs',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('name')],
      },
    },
  ],
}
