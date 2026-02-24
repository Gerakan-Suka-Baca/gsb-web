"use server";

import { getPayloadCached } from "@/lib/payload";

export const searchMajors = async (query: string, universityName?: string) => {
  if (!query && !universityName) return [];
  if (query && query.length > 0 && query.length < 3) return [];

  try {
    const payload = await getPayloadCached();
    
    const payloadDB = (payload.db as any).collections['studyPrograms'];
    const pipeline: any[] = [];

    if (universityName) {
       pipeline.push({ $match: { name: { $regex: new RegExp(universityName, 'i') } } });
    }

    pipeline.push({ $unwind: "$programs" });

    const programMatch: any = { "programs.category": "snbt" };
    if (query && query.length >= 3) {
       programMatch["programs.name"] = { $regex: new RegExp(query, 'i') };
    }
    
    pipeline.push({ $match: programMatch });
    pipeline.push({ $limit: 30 });

    const results = await payloadDB.aggregate(pipeline);

    return results.map((doc: any) => ({
      id: doc.programs._id.toString(),
      name: doc.programs.name,
    }));
  } catch (error) {
    console.error("Error searching majors:", error);
    return [];
  }
};
