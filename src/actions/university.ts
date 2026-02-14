"use server";

interface University {
  id: number;
  name: string;
  type: string;
  group: "PTN" | "PTS";
  province_name: string;
}

interface ApiResponse {
  is_success: boolean;
  data: University[];
  message: string;
}

export const searchUniversities = async (query: string): Promise<University[]> => {
  if (!query || query.length < 3) return [];

  try {
    const apiKey = process.env.API_KAMPUS;
    if (!apiKey) {
      console.error("API_KAMPUS is not defined");
      return [];
    }

    const response = await fetch(
      `https://use.api.co.id/regional/indonesia/universities?name=${encodeURIComponent(
        query
      )}&size=20`,
      {
        headers: {
          "x-api-co-id": apiKey,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch universities", response.statusText);
      return [];
    }

    const data = (await response.json()) as ApiResponse;

    if (!data.is_success) {
      console.error("API returned error", data.message);
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching universities:", error);
    return [];
  }
};
