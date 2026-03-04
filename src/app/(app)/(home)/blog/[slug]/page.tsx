import { getPayloadCached } from "@/lib/payload";
import { notFound } from "next/navigation";
import { RichText } from "@/components/ui/RichText";
import { ArticleAnalyticsTracker } from "@/components/analytics/ArticleAnalyticsTracker";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { User, Media, Article, ArticleLabel } from "@/payload-types";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayloadCached();
  const page = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (!page.docs[0]) return {};

  return {
    title: `${page.docs[0].title} - Gema Simpul Berdaya`,
    description: page.docs[0].excerpt || `Artikel tentang ${page.docs[0].title}`,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayloadCached();
  
  const result = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  const article = result.docs[0] as Article;

  if (!article) {
    notFound();
  }

  const contentString = JSON.stringify(article.content);
  const wordCount = contentString.split(/\s+/).length;

  const coverImageUrl = typeof article.coverImage === 'object' && (article.coverImage as Media)?.url
    ? (article.coverImage as Media).url
    : null;

  const authors = (article.authors ?? [])
    .map((author) => {
      if (typeof author === "string") return null;
      const user = author as User;
      return user.fullName || user.username || user.email || null;
    })
    .filter((author): author is string => Boolean(author))
    .join(", ") || "Admin";

  const labels = (article.labels ?? [])
    .map((label) => (typeof label === "string" ? null : (label as ArticleLabel).name))
    .filter((label): label is string => Boolean(label));

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-6">
      <ArticleAnalyticsTracker
        title={article.title}
        slug={article.slug || slug}
        category="Article"
        author={authors}
        labels={labels}
        publishedDate={article.publishedDate ? String(article.publishedDate) : undefined}
        wordCount={wordCount}
      />

      <div className="mb-8">
        <div className="flex gap-2 mb-4 flex-wrap">
          {labels.map((label, i) => (
            <Badge key={i} variant="secondary" className="bg-gsb-orange/10 text-gsb-orange hover:bg-gsb-orange/20">
              {label}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span>{authors}</span>
          <span>•</span>
          {article.publishedDate && (
            <span>{format(new Date(article.publishedDate), "d MMMM yyyy", { locale: id })}</span>
          )}
        </div>
      </div>

      {coverImageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-10 shadow-lg">
          <Image
            src={coverImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
        {article.excerpt && (
            <div className="text-xl text-muted-foreground leading-relaxed font-medium mb-8 border-l-4 border-gsb-orange pl-4">
                {article.excerpt}
            </div>
        )}
        <RichText content={article.content} />
      </div>
    </div>
  );
}
