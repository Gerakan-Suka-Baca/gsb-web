import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { TryoutView } from "@/modules/tryouts/ui/views/TryoutView";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPayloadCached } from "@/lib/payload";

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

  // Check if user profile exists in Payload
  const payload = await getPayloadCached();
  const { docs: users } = await payload.find({
    collection: "users",
    where: {
      clerkUserId: {
        equals: userId,
      },
    },
    limit: 1,
  });

  if (!users[0]) {
    redirect("/complete-profile");
  }
  if (!users[0].profileCompleted) {
    redirect("/complete-profile");
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
