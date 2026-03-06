import 'server-only'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { LegalPage } from '@/payload-types'

const legalTypes = ["tos", "privacy-policy", "cookie-policy", "disclaimer", "refund-policy"] as const;

export const getLegalPages = async (): Promise<LegalPage[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'legal-pages',
      limit: 100,
      depth: 0,
      sort: '-updatedAt',
    })
    return result.docs
  } catch (error) {
    console.error("Error fetching legal pages:", error)
    return []
  }
};

export const getLegalPageBySlugOrType = async (slug: string): Promise<LegalPage | undefined> => {
  try {
    const payload = await getPayload({ config: configPromise })

    // Try by slug
    const bySlug = await payload.find({
      collection: 'legal-pages',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
      depth: 0,
    })

    if (bySlug.docs.length > 0) {
      return bySlug.docs[0]
    }

    // Try by type if applicable
    if (legalTypes.includes(slug as (typeof legalTypes)[number])) {
      const byType = await payload.find({
        collection: 'legal-pages',
        where: {
          type: {
            equals: slug,
          },
        },
        limit: 1,
        depth: 0,
      })
      if (byType.docs.length > 0) {
        return byType.docs[0]
      }
    }
  } catch (error) {
    console.error(`Error fetching legal page for slug ${slug}:`, error)
  }
  return undefined
};
