// import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
// import { TryoutView } from "@/modules/tryouts/ui/views/tryout-view";

// import type { Metadata } from "next";

interface Props {
  params: Promise<{ tryoutId: string }>;
}

const Page = async ({ params }: Props) => {
  const { tryoutId } = await params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.tryouts.getOne.queryOptions({ tryoutId })
  );

  return (
    // <HydrationBoundary state={dehydrate(queryClient)}>
    //   <TryoutView tryoutId={tryoutId} />
    // </HydrationBoundary>
    <div>
      Tryout page is disabled for now.
    </div>
  );
};

export default Page;
