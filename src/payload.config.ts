// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { uploadthingStorage } from "@payloadcms/storage-uploadthing";

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tryouts } from './collections/Tryouts'
import { Questions } from './collections/Questions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { TryoutAttempts } from './collections/TryoutAttempts'
import { TryoutPayments } from './collections/TryoutPayments'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Tryouts, Questions, TryoutAttempts, TryoutPayments],
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
    url: process.env.DATABASE_URI || "",
    connectOptions: {
      family: 4,
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    uploadthingStorage({
      collections: {
        media: true,
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN,
        acl: "public-read",
      },
    }),
  ],
});
