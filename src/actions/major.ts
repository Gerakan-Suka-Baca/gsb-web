"use server";

import { getPayloadCached } from "@/lib/payload";

export const searchMajors = async (query: string, universityName?: string) => {
  if (!query && !universityName) return [];
  if (query && query.length > 0 && query.length < 3) return [];

  try {
    const payload = await getPayloadCached();
    
    // First find the university ID if universityName is provided
    let universityId = undefined;
    if (universityName) {
      const uniRes = await payload.find({
        collection: "universities",
        where: { name: { equals: universityName } },
        limit: 1,
      });
      if (uniRes.docs.length > 0) {
        universityId = uniRes.docs[0].id;
      }
    }

    const whereClause: any = {
      and: [
        { category: { equals: "snbt" } }
      ]
    };

    if (query && query.length >= 3) {
      whereClause.and.push({ name: { contains: query } });
    }

    if (universityId) {
       whereClause.and.push({ university: { equals: universityId } });
    }

    const results = await payload.find({
      collection: "studyPrograms",
      where: whereClause,
      limit: 30,
      depth: 0,
    });

    return results.docs.map(doc => ({
      id: doc.id as string,
      name: doc.name as string,
    }));
  } catch (error) {
    console.error("Error searching majors:", error);
    return [];
  }
};
