import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { TryoutScoreDashboard } from "@/modules/tryouts/ui/components/TryoutScoreDashboard";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ tryoutId: string }>;
}

const ResultsPage = async ({ params }: Props) => {
  const { tryoutId } = await params;

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/tryout/${tryoutId}/results`)}`);
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.tryouts.getScoreResults.queryOptions({ tryoutId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="bg-background min-h-[calc(100vh-4rem)] pt-6">
        <TryoutScoreDashboard tryoutId={tryoutId} />
      </div>
    </HydrationBoundary>
  );
};

export default ResultsPage;
