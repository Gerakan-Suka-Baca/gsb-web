/**
 * Universitas module tRPC router.
 * Contains university-focused queries for program details, recommendations, and target analysis.
 */

import { createTRPCRouter } from "@/trpc/init";
import {
  getProgramStudyDetail,
  getRecommendations,
  getTargetAnalysis,
} from "./queries/university.queries";

export const universitasRouter = createTRPCRouter({
  getProgramStudyDetail,
  getRecommendations,
  getTargetAnalysis,
});
