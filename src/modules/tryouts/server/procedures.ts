import { createTRPCRouter } from "@/trpc/init";
import { getExplanation } from "@/modules/tryouts/server/queries/getExplanation";
import { getMany, getMetadata, getOne, getSubtest } from "@/modules/tryouts/server/queries/getTryoutContent";
import { getMyPaymentHistory } from "@/modules/tryouts/server/queries/getMyPaymentHistory";
import { getScoreResults } from "@/modules/tryouts/server/queries/getScoreResults";

/**
 * Tryout-specific tRPC router.
 * University queries (getProgramStudyDetail, getRecommendations, getTargetAnalysis)
 * have been moved to the universitas module router.
 */
export const tryoutsRouter = createTRPCRouter({
  getOne,
  getMetadata,
  getSubtest,
  getMany,
  getScoreResults,
  getMyPaymentHistory,
  getExplanation,
});
