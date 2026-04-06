"use server";

import { getPayloadCached } from "@/lib/payload";

interface University {
  id: string | number;
  name: string;
  type?: string;
  group?: "PTN" | "PTS";
  province_name?: string;
}

export const searchUniversities = async (query: string): Promise<University[]> => {
  if (!query || query.length < 3) return [];

  try {
    const payload = await getPayloadCached();
    
    const result = await payload.find({
      collection: "universities",
      where: {
        name: { contains: query },
      },
      limit: 20,
      depth: 0,
    });

    return result.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      // Field lain opsional karena kita hanya butuh name untuk saat ini
      type: (doc.status as string) || "",
      group: doc.status === "negeri" ? "PTN" : "PTS",
      province_name: (doc.province as string) || "",
    }));
  } catch (error) {
    console.error("Error fetching universities:", error);
    return [];
  }
};
