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
    
    const payloadDB = (payload.db as unknown as { collections?: Record<string, UniversityCollection> })
      .collections?.["universities"];
    if (!payloadDB) return [];
    const pipeline: any[] = [];

    if (universityName) {
       pipeline.push({ $match: { name: { $regex: new RegExp(universityName, 'i') } } });
    }

    pipeline.push({ $unwind: "$programs" });

    const programMatch: Record<string, unknown> = { "programs.category": "snbt" };
    if (query && query.length >= 3) {
       programMatch["programs.name"] = { $regex: new RegExp(query, 'i') };
    }
    
    pipeline.push({ $match: programMatch });
    pipeline.push({ $limit: 30 });

    const results = await payloadDB.aggregate(pipeline);

    return results
      .map((doc) => {
        const program = doc.programs;
        const idValue = program?._id;
        const id = typeof idValue === "string" ? idValue : idValue?.toString();
        const name = program?.name;
        if (!id || !name) return null;
        return { id, name };
      })
      .filter((item): item is { id: string; name: string } => Boolean(item));
  } catch (error) {
    console.error("Error searching majors:", error);
    return [];
  }
};
