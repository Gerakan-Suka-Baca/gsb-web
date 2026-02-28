import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { TryoutView } from "@/modules/tryouts/ui/views/TryoutView";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// import type { Metadata } from "next";

interface Props {
  params: Promise<{ tryoutId: string }>;
}

const Page = async ({ params }: Props) => {
  const { tryoutId } = await params;

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/tryout/${tryoutId}`)}`);
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.tryouts.getOne.queryOptions({ tryoutId })
  );
  void queryClient.prefetchQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TryoutView tryoutId={tryoutId} />
    </HydrationBoundary>
  );
};

export default Page;
