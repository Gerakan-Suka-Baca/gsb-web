import { getPayloadCached } from "@/lib/payload";
import { UniversitasList } from "@/modules/universitas/UniversitasList";
import type { Where } from "payload";

export const revalidate = 300;

export const metadata = {
  title: "Daftar Universitas — GemaSimpulBerdaya",
  description:
    "Cari dan temukan universitas impianmu di seluruh Indonesia. Lihat data program studi, akreditasi, dan lokasi kampus.",
};

const PER_PAGE = 12;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    province?: string;
    q?: string;
  }>;
}

type UniversityListDoc = {
  id: string;
  name?: string;
  abbreviation?: string;
  status?: string;
  accreditation?: string;
  city?: string;
  province?: string;
  image?: string | null;
  programCount?: number;
  completenessScore?: number;
};

type ProvinceCollection = {
  distinct: (field: string) => Promise<string[]>;
};

export default async function UniversitasPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const statusFilter = params.status || "negeri";
  const provinceFilter = params.province || "";
  const searchQuery = (params.q || "").trim();

  const db = await getPayloadCached();

  const where: Where = { and: [] };
  const conditions = where.and as Where[];

  if (statusFilter && statusFilter !== "all") {
    conditions.push({ status: { equals: statusFilter } });
  }

  if (provinceFilter) {
    conditions.push({ province: { equals: provinceFilter } });
  }

  if (searchQuery) {
    conditions.push({
      or: [
        { name: { contains: searchQuery } },
        { abbreviation: { contains: searchQuery } },
        { city: { contains: searchQuery } },
      ],
    });
  }

  if (conditions.length === 0) {
    delete where.and;
  }

  const result = await db.find({
    collection: "universities",
    page: currentPage,
    limit: PER_PAGE,
    depth: 0,
    where: conditions.length > 0 ? where : undefined,
    sort: ["-completenessScore", "-programCount", "name"],
    select: {
      name: true,
      abbreviation: true,
      status: true,
      accreditation: true,
      city: true,
      province: true,
      image: true,
      programCount: true,
      completenessScore: true,
    },
  });

  const imageIds = (result.docs as UniversityListDoc[])
    .map((doc) => doc.image)
    .filter((id): id is string => typeof id === "string");

  const mediaMap = new Map<string, string>();
  if (imageIds.length > 0) {
    const mediaDocs = await db.find({
      collection: "media",
      where: { id: { in: imageIds } },
      depth: 0,
      pagination: false,
    });
    mediaDocs.docs.forEach((media) => {
      const mediaId = (media as { id?: string }).id;
      const mediaUrl = (media as { url?: string }).url;
      if (mediaId && mediaUrl) {
        mediaMap.set(mediaId, mediaUrl);
      }
    });
  }

  const universities = (result.docs as UniversityListDoc[])
    .map((doc) => {
      const completeness = typeof doc.completenessScore === "number" ? doc.completenessScore : 0;

      return {
        id: doc.id,
        name: doc.name || "",
        abbreviation: doc.abbreviation || "",
        status: doc.status || "",
        accreditation: doc.accreditation || "",
        city: doc.city || "",
        province: doc.province || "",
        programCount: typeof doc.programCount === "number" ? doc.programCount : 0,
        imageUrl: doc.image ? mediaMap.get(doc.image) ?? null : null,
        completeness,
      };
    })
    .filter((u) => u.name);

  const provinceCollection = (db.db as { collections?: Record<string, ProvinceCollection> })
    .collections?.["universities"];
  const provinces = provinceCollection
    ? (await provinceCollection.distinct("province")).filter(Boolean).sort()
    : [];

  return (
    <UniversitasList
      universities={universities}
      provinces={provinces}
      totalPages={result.totalPages}
      currentPage={currentPage}
      totalDocs={result.totalDocs}
      statusFilter={statusFilter}
      provinceFilter={provinceFilter}
      searchQuery={searchQuery}
    />
  );
}
