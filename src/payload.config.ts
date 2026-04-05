// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { uploadthingStorage } from "@payloadcms/storage-uploadthing";

import { Admins } from './collections/users/Admins'
import { Users } from './collections/users/Users'
import { Media, ArticleMedia } from './collections/media/Media'
import { Tryouts } from './collections/tryout/Tryouts'
import { Questions } from './collections/tryout/Questions'
import { TryoutAttempts } from './collections/tryout/TryoutAttempts'
import { TryoutPayments } from './collections/tryout/TryoutPayments'
import { TryoutScores } from './collections/tryout/TryoutScores'
import { TryoutExplanations } from './collections/tryout/TryoutExplanations'
import { Universities } from './collections/universitas/Universities'
import { UniversityPrograms } from './collections/universitas/UniversityPrograms'
import { Articles } from './collections/blog/Articles'
import { ArticleLabels } from './collections/blog/ArticleLabels'
import { LegalPages } from './collections/blog/LegalPages'
import { ExplanationMedia } from './collections/media/ExplanationMedia'
import { UniversityMedia } from './collections/media/UniversityMedia'
import { TryoutVouchers } from './collections/voucher/TryoutVouchers'
import { AppSettings } from './collections/settings/AppSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Admins, 
    Users, 
    Media, 
    ArticleMedia,
    ExplanationMedia,
    UniversityMedia,
    Tryouts, 
    Questions, 
    TryoutAttempts, 
    TryoutVouchers,
    TryoutPayments, 
    TryoutScores, 
    TryoutExplanations, 
    Universities,
    UniversityPrograms,
    Articles,
    ArticleLabels,
    LegalPages
  ],
  globals: [AppSettings],
  // @ts-expect-error: rateLimit type definition missing
  rateLimit: {
    trustProxy: true,
    max: 500,
    window: 15 * 60 * 1000,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || process.env.DATABASE_URL || "",
    connectOptions: {
      // Force IPv4 if local network has IPv6 issues
      family: 4,
      // Best Practice: Pool Size
      maxPoolSize: 100,
      minPoolSize: 0,
      // Best Practice: Timeouts & Connections
      maxConnecting: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 0,
      connectTimeoutMS: 10000,
      waitQueueTimeoutMS: 0,
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    uploadthingStorage({
      collections: {
        media: true,
        'article-media': true,
        'university-media': true,
        'explanation-media': true,
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN,
        acl: "public-read",
      },
    }),
  ],
});
