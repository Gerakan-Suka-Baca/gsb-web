import { z } from "zod";
import { protectedProcedure } from "@/trpc/init";
import { getCacheValue, setCacheValue } from "@/modules/shared/server/services/cache.service";
import type { TryoutScoreDoc } from "@/modules/shared/types/university.types";

export const getLeaderboard = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const cacheKey = `leaderboard:${input.tryoutId}`;
    const cachedData = await getCacheValue<any[]>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const result = await ctx.db.find({
        collection: "tryout-scores",
        where: { tryout: { equals: input.tryoutId } },
        sort: "-finalScore",
        limit: 100, // Fetch top 100
        depth: 1, // Depth 1 to get user details
      });

      const scores = result.docs as any[];
      
      const leaderboard = scores.map((score, index) => {
        const user = score.user;
        const name = user?.fullName || user?.username || "Peserta Rahasia";
        
        return {
          rank: index + 1,
          userId: user?.id || `unknown-${index}`,
          name,
          finalScore: score.finalScore || 0,
          school: user?.schoolOrigin || "Sekolah Tidak Diketahui",
        };
      });

      // Cache the leaderboard for 5 minutes since scores don't change extremely often
      await setCacheValue(cacheKey, leaderboard, 5 * 60 * 1000);

      return leaderboard;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  });
