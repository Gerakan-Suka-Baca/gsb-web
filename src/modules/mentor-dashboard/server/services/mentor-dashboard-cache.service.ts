import { clearCacheByPrefixAsync } from "@/modules/shared/server/services/cache.service";

export const clearMentorDashboardCache = async () => {
  await clearCacheByPrefixAsync("mentor_dashboard_");
};
