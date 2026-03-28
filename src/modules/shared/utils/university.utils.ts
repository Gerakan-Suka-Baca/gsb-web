/**
 * University-related utility functions shared across tryout and universitas modules.
 * Moved from tryouts/server/utils/procedure.utils.ts
 */

/**
 * Calculate admission chance using a sigmoid function.
 */
interface ChanceSettings {
  k: number;
  minPercent: number;
  maxPercent: number;
}

export const calculateChance = (
  finalScore: number,
  passingGrade: number,
  settings: ChanceSettings = { k: 0.05, minPercent: 5, maxPercent: 95 }
): number => {
  const rawChance = 100 / (1 + Math.exp(-settings.k * (finalScore - passingGrade)));
  return Math.max(settings.minPercent, Math.min(settings.maxPercent, Math.round(rawChance)));
};

/**
 * Extract meaningful keywords from a major/program name for search matching.
 */
export const getMajorKeywords = (major: string | undefined | null): string[] => {
  if (!major) return [];
  const lower = major.toLowerCase();
  const blacklist = ["teknik", "pendidikan", "ilmu", "sistem", "manajemen", "studi"];
  const words = lower.split(" ").filter((w) => w.length > 3 && !blacklist.includes(w));
  return words.length > 0 ? words : [major.split(" ")[0]];
};
