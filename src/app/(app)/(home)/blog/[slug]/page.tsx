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
    <div className="w-full py-6 md:py-10">
      <ArticleAnalyticsTracker
        title={article.title}
        slug={article.slug || slug}
        category="Article"
        author={authors}
        labels={labels}
        publishedDate={article.publishedDate ? String(article.publishedDate) : undefined}
        wordCount={wordCount}
      />

      <div className="w-full bg-card border-y sm:border sm:rounded-3xl border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gsb-maroon to-gsb-red text-white px-4 sm:px-6 md:px-10 py-6 md:py-9">
          <div className="flex gap-2 mb-4 flex-wrap">
            {labels.map((label, i) => (
              <Badge key={i} variant="secondary" className="bg-white/15 text-white hover:bg-white/25 border-transparent">
                {label}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-white/85 text-sm">
            <span>{authors}</span>
            <span>•</span>
            {article.publishedDate && (
              <span>{format(new Date(article.publishedDate), "d MMMM yyyy", { locale: id })}</span>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-10 py-6 md:py-10 max-w-4xl mx-auto">
          {coverImageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-8 shadow-lg">
              <Image
                src={coverImageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          )}

          {article.excerpt && (
            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium mb-8 border-l-4 border-gsb-orange pl-4">
                {article.excerpt}
            </div>
          )}

          <RichText
            content={article.content}
            className="prose-base md:prose-lg prose-slate dark:prose-invert max-w-none prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:marker:text-gsb-orange prose-img:rounded-xl prose-a:text-gsb-orange prose-a:no-underline hover:prose-a:underline prose-blockquote:border-gsb-orange prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-muted prose-hr:border-border"
          />
        </div>
      </div>
    </div>
  );
}
