"use server";

import { getPayloadCached } from "@/lib/payload";
import type { Where } from "payload";

export const searchMajors = async (query: string, universityName?: string) => {
  if (!query && !universityName) return [];
  if (query && query.length > 0 && query.length < 3) return [];

  try {
    const payload = await getPayloadCached();

    const where: Where = {
      category: { equals: "snbt" },
    };

    if (universityName) {
      where["universityName"] = { contains: universityName };
    }

    if (query && query.length >= 3) {
      where["name"] = { contains: query };
    }

    const results = await payload.find({
      collection: "university-programs",
      where,
      limit: 30,
      depth: 0,
      pagination: false,
    });

    return results.docs
      .map((doc) => {
        const id = String(doc.id);
        const name = (doc as { name?: string }).name;
        if (!id || !name) return null;
        return { id, name };
      })
      .filter((item): item is { id: string; name: string } => Boolean(item));
  } catch (error) {
    console.error("Error searching majors:", error);
    return [];
  }
};
