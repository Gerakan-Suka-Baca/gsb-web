import { notFound } from "next/navigation";
import { RichText } from "@/components/ui/RichText";
import { ArticleAnalyticsTracker } from "@/components/analytics/ArticleAnalyticsTracker";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getLegalPageBySlugOrType } from "@/lib/legal-pages";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLegalPageBySlugOrType(slug);

  if (!page) return {};

  return {
    title: `${page.title} - Gema Simpul Berdaya`,
    description: `Halaman legal ${page.title}`,
  };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLegalPageBySlugOrType(slug);

  if (!page) {
    notFound();
  }

  const contentString = JSON.stringify(page.content);
  const wordCount = contentString.split(/\s+/).length;

  return (
    <div className="w-full py-6 md:py-10">
      <ArticleAnalyticsTracker
        title={page.title}
        slug={page.slug || slug}
        category="Legal"
        publishedDate={page.lastUpdated ? String(page.lastUpdated) : undefined}
        wordCount={wordCount}
      />

      <div className="w-full bg-card border-y sm:border sm:rounded-3xl border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gsb-maroon to-gsb-red text-white px-4 sm:px-6 md:px-10 py-6 md:py-9">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-3">
            {page.title}
          </h1>
          {page.lastUpdated && (
            <p className="text-white/85">
              Terakhir diperbarui: {format(new Date(page.lastUpdated), "d MMMM yyyy", { locale: id })}
            </p>
          )}
        </div>

        <div className="px-4 sm:px-6 md:px-10 py-6 md:py-10">
          <RichText
            content={page.content}
            className="prose-base md:prose-lg prose-slate dark:prose-invert max-w-none prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:marker:text-gsb-orange"
          />
        </div>
      </div>
    </div>
  );
}
