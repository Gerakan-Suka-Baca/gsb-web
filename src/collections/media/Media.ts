import type { CollectionConfig } from "payload";
import { isAdminOrAbove } from "../accessHelpers";

export const QuestionMedia: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Question Media",
    plural: "Question Media",
  },
  admin: {
    group: "Media",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text / Deskripsi Gambar",
    },
    {
      name: "relatedTryout",
      type: "relationship",
      relationTo: "tryouts",
      admin: {
        position: "sidebar",
        description: "Terkait dengan Batch Tryout (Opsional)",
      },
    },
    {
      name: "relatedQuestion",
      type: "relationship",
      relationTo: "questions",
      admin: {
        position: "sidebar",
        description: "Terkait dengan Subtest/Soal (Durable Link)",
      },
    },
    {
      name: "relatedUniversity",
      type: "relationship",
      relationTo: "universities",
      admin: {
        position: "sidebar",
        description: "Terkait dengan Universitas (Jika ada)",
      },
    },
    {
      name: "relatedSubtest",
      type: "text",
      admin: {
        position: "sidebar",
        description: "ID atau Nama Subtest Terkait (Opsional - Legacy)",
      },
    },
    {
      name: "relatedQuestionNumber",
      type: "number",
      admin: {
        position: "sidebar",
        description: "Nomor Soal Terkait (Opsional)",
      },
    },
  ],
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*"],
  },
};

export const Media = QuestionMedia;

export const ArticleMedia: CollectionConfig = {
  slug: "article-media",
  labels: {
    singular: "Article Media",
    plural: "Article Media",
  },
  admin: {
    group: "Media",
    description: "Media khusus untuk konten artikel.",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text / Deskripsi Gambar",
    },
    {
      name: "relatedArticle",
      type: "relationship",
      relationTo: "articles",
      admin: {
        position: "sidebar",
        description: "Terkait dengan artikel tertentu (opsional).",
      },
    },
  ],
  upload: {
    staticDir: "article-media",
    mimeTypes: ["image/*"],
  },
};
