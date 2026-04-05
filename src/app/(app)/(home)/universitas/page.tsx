import { getPayloadCached } from "@/lib/payload";
import { UniversitasList } from "@/modules/universitas/UniversitasList";
import type { Where } from "payload";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Universitas — GemaSimpulBerdaya",
  description:
    "Cari dan temukan universitas impianmu di seluruh Indonesia. Lihat data program studi, akreditasi, dan lokasi kampus.",
};

const PER_PAGE = 12;

const toSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
  slugField?: string;
  name?: string;
  abbreviation?: string;
  status?: string;
  accreditation?: string;
  city?: string;
  province?: string;
  image?: { url?: string } | string | null;
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
    depth: 1,
    where: conditions.length > 0 ? where : undefined,
    sort: ["-completenessScore", "-programCount", "name"],
    select: {
      name: true,
      slugField: true,
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

  const universities = (result.docs as UniversityListDoc[])
    .map((doc) => {
      const slug = doc.slugField || toSlug(doc.name || doc.id);
      const completeness = typeof doc.completenessScore === "number" ? doc.completenessScore : 0;

      return {
        id: doc.id,
        slug,
        name: doc.name || "",
        abbreviation: doc.abbreviation || "",
        status: doc.status || "",
        accreditation: doc.accreditation || "",
        city: doc.city || "",
        province: doc.province || "",
        programCount: typeof doc.programCount === "number" ? doc.programCount : 0,
        imageUrl:
          typeof doc.image === "object" && doc.image?.url
            ? doc.image.url
            : null,
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
