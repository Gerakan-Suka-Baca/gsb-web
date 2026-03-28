import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { LeaderboardView } from "@/modules/tryouts/ui/views/LeaderboardView";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard Tryout",
  description: "Leaderboard Tryout Nasional",
};

const Page = async () => {
  const queryClient = getQueryClient();
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/tryout/leaderboard")}`);
  }

  // Pre-fetch the tryouts list so the pills can be rendered immediately
  void queryClient.prefetchQuery(trpc.tryouts.getMany.queryOptions({}));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LeaderboardView />
    </HydrationBoundary>
  );
};

export default Page;
