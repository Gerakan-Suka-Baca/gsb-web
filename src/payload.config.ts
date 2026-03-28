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
import { QuestionMedia, ArticleMedia } from './collections/media/Media'
import { Tryouts } from './collections/tryout/Tryouts'
import { Questions } from './collections/tryout/Questions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { TryoutAttempts } from './collections/tryout/TryoutAttempts'
import { TryoutPayments } from './collections/tryout/TryoutPayments'
import { TryoutScores } from './collections/tryout/TryoutScores'
import { TryoutExplanations } from './collections/tryout/TryoutExplanations'
import { TryoutVouchers } from './collections/voucher/TryoutVouchers'
import { Universities } from './collections/universitas/Universities'
import { UniversityPrograms } from './collections/universitas/UniversityPrograms'

import { UniversityMedia } from './collections/media/UniversityMedia'
import { ExplanationMedia } from './collections/media/ExplanationMedia'
import { Articles } from './collections/blog/Articles'
import { LegalPages } from './collections/blog/LegalPages'
import { ArticleLabels } from './collections/blog/ArticleLabels'

// Configuration & Settings
import { AppSettings } from './collections/settings/AppSettings'

export default buildConfig({
  admin: {
    user: Admins.slug,
    dateFormat: "dd MMM yyyy HH:mm",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  defaultDepth: 0,
  collections: [
    Admins,
    Users,
    QuestionMedia,
    ArticleMedia,
    UniversityMedia,
    Tryouts,
    Questions,
    TryoutAttempts,
    ExplanationMedia,
    TryoutPayments,
    TryoutScores,
    TryoutExplanations,
    TryoutVouchers,
    Universities,
    UniversityPrograms,
    Articles,
    ArticleLabels,
    LegalPages,
  ],
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
    url: process.env.DATABASE_URL || "",
    connectOptions: {
      family: 4,
      maxPoolSize: 100,
      minPoolSize: 0,
      maxConnecting: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 0,
      connectTimeoutMS: 10000,
      waitQueueTimeoutMS: 0,
    },
  }),
  sharp,
  globals: [
    AppSettings,
  ],
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || ''].filter(Boolean),
  endpoints: [
    {
      path: '/api/v1/health',
      method: 'get',
      handler: () => {
        return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
      },
    },
  ],
  plugins: [
    payloadCloudPlugin({ storage: false }),
    uploadthingStorage({
      collections: {
        media: true,
        "article-media": true,
        "university-media": true,
        "explanation-media": true,
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN,
        acl: "public-read",
      },
    }),
  ],
});
