"use server";

import { getPayloadCached } from "@/lib/payload";

type UniversityProgramResult = {
  programs?: {
    _id?: { toString: () => string } | string;
    name?: string;
  };
};

type UniversityCollection = {
  aggregate: (pipeline: Record<string, unknown>[]) => Promise<UniversityProgramResult[]>;
};

export const searchMajors = async (query: string, universityName?: string) => {
  if (!query && !universityName) return [];
  if (query && query.length > 0 && query.length < 3) return [];

  try {
    const payload = await getPayloadCached();
    
    const whereClause: any = {
      category: { equals: "snbt" },
    };

    if (universityName) {
      // Prioritaskan pencarian berdasarkan nama universitas
      whereClause.universityName = { contains: universityName };
    }

    if (query && query.length >= 3) {
      whereClause.name = { contains: query };
    }

    const result = await payload.find({
      collection: "university-programs",
      where: whereClause,
      limit: 30,
      depth: 0,
    });

    return result.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
    }));
  } catch (error) {
    console.error("Error searching majors:", error);
    return [];
  }
};
