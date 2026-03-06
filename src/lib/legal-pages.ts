import type { LegalPage } from "@/payload-types";
import { headers } from "next/headers";

const legalTypes = ["tos", "privacy-policy", "cookie-policy", "disclaimer", "refund-policy"] as const;

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const getBaseUrl = async () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.VERCEL_URL) {
    return `https://${normalizeBaseUrl(process.env.VERCEL_URL)}`;
  }

  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const proto = incomingHeaders.get("x-forwarded-proto") ?? "http";
  if (!host) {
    throw new Error("APP base URL tidak tersedia. Set NEXT_PUBLIC_APP_URL.");
  }
  return `${proto}://${host}`;
};

type PayloadListResponse<T> = {
  docs: T[];
};

const toUrl = async (path: string) => `${await getBaseUrl()}${path}`;

export const getLegalPages = async (): Promise<LegalPage[]> => {
  try {
    const res = await fetch(
      await toUrl("/api/legal-pages?limit=100&depth=0&sort=-updatedAt"),
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as PayloadListResponse<LegalPage>;
    return data.docs ?? [];
  } catch {
    return [];
  }
};

export const getLegalPageBySlugOrType = async (slug: string): Promise<LegalPage | undefined> => {
  try {
    const bySlugRes = await fetch(
      await toUrl(`/api/legal-pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`),
      { cache: 'no-store' }
    );

    if (bySlugRes.ok) {
      const bySlugData = (await bySlugRes.json()) as PayloadListResponse<LegalPage>;
      if (bySlugData.docs?.[0]) return bySlugData.docs[0];
    }

    if (!legalTypes.includes(slug as (typeof legalTypes)[number])) {
      return undefined;
    }

    const byTypeRes = await fetch(
      await toUrl(`/api/legal-pages?where[type][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`),
      { cache: 'no-store' }
    );
    if (!byTypeRes.ok) return undefined;
    const byTypeData = (await byTypeRes.json()) as PayloadListResponse<LegalPage>;
    return byTypeData.docs?.[0];
  } catch (error) {
    console.error("Error fetching legal page:", error);
    return undefined;
  }
};
