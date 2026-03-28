import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPayloadCached } from "@/lib/payload";
import { ExplanationViewer } from "@/modules/tryouts/ui/components/ExplanationViewer";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ tryoutId: string }>;
}

const PembahasanPage = async ({ params }: Props) => {
  const { tryoutId } = await params;

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/tryout/${tryoutId}/explanation`)}`);
  }

  const payload = await getPayloadCached();
  const { docs: users } = await payload.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });

  if (!users[0] || !users[0].profileCompleted) {
    redirect("/complete-profile");
  }

  const currentUser = users[0];
  const [attemptResult, scoreResult] = await Promise.all([
    payload.find({
      collection: "tryout-attempts",
      where: {
        and: [
          { user: { equals: currentUser.id } },
          { tryout: { equals: tryoutId } },
          { status: { equals: "completed" } },
        ],
      },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: "tryout-scores",
      where: {
        and: [
          { user: { equals: currentUser.id } },
          { tryout: { equals: tryoutId } },
          { paymentType: { equals: "paid" } },
        ],
      },
      limit: 1,
      depth: 0,
    }),
  ]);

  if (!attemptResult.docs[0] || !scoreResult.docs[0]) {
    redirect(`/tryout/${tryoutId}/results`);
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.tryouts.getExplanation.queryOptions({ tryoutId })
  );
  void queryClient.prefetchQuery(
    trpc.tryouts.getScoreResults.queryOptions({ tryoutId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExplanationViewer tryoutId={tryoutId} />
    </HydrationBoundary>
  );
};

export default PembahasanPage;
