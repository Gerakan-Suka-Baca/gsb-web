import { CollectionConfig } from 'payload'
import formatSlug from '../../utils/formatSlug'

export const LegalPages: CollectionConfig = {
  slug: 'legal-pages',
  admin: {
    useAsTitle: 'title',
    group: 'Blogs',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
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
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Terms of Service', value: 'tos' },
        { label: 'Privacy Policy', value: 'privacy-policy' },
        { label: 'Cookie Policy', value: 'cookie-policy' },
        { label: 'Disclaimer', value: 'disclaimer' },
        { label: 'Refund Policy', value: 'refund-policy' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
