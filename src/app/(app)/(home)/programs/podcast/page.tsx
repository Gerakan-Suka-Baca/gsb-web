import { trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/trpc/server";
import PodcastContent from "./PodcastContent";

export const dynamic = "force-dynamic";

export default async function PodcastPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.podcast.getEpisodes.queryOptions({ limit: 9, offset: 0 })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PodcastContent />
    </HydrationBoundary>
  );
}
