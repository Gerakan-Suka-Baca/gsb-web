import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { caller, getQueryClient, trpc } from "@/trpc/server";
import { TryoutView } from "@/modules/tryouts/ui/views/tryout-view";
import { redirect } from "next/navigation";

// import type { Metadata } from "next";

interface Props {
  params: Promise<{ tryoutId: string }>;
}

const Page = async ({ params }: Props) => {
  const { tryoutId } = await params;

  const session = await caller.auth.session();
  if (!session.user) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.tryouts.getOne.queryOptions({ tryoutId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TryoutView tryoutId={tryoutId} />
    </HydrationBoundary>
  );
};

export default Page;
