import { TryoutListView } from "@/modules/tryouts/ui/views/TryoutListView";
import { getQueryClient, trpc } from "@/trpc/server";
import { getPayloadCached } from "@/lib/payload";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// export const metadata = {
//   title: "About Sema FTD",
//   description: "About Sema FTD",
//   generator: "Sema FTD",
//   applicationName: "Website Sema FTD",
//   referrer: "origin-when-cross-origin",
//   keywords: [
//     "Sema FTD",
//     "Senat Mahasiswa FTD",
//     "UBM",
//     "FTD",
//     "Senat Mahasiswa FTD UBM",
//     "Senat Mahasiswa UBM",
//     "About Sema FTD",
//     "About Senat Mahasiswa FTD",
//     "About Senat Mahasiswa FTD UBM",
//     "About Senat Mahasiswa UBM",
//   ],
//   creator: "Christopher Haris",
//   publisher: "Christopher Haris",
//   formatDetection: {
//     email: false,
//     address: false,
//     telephone: false,
//   },
// };

const Page = async () => {
  const queryClient = getQueryClient();
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/tryout")}`);
  }

  const payload = await getPayloadCached();
  const { docs: users } = await payload.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });
  const user = users[0];
  if (!user || !user.profileCompleted) {
    redirect("/complete-profile");
  }

  void queryClient.prefetchQuery(trpc.tryouts.getMany.queryOptions({}));
  void queryClient.prefetchQuery(trpc.tryoutAttempts.getMyAttempts.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TryoutListView />
    </HydrationBoundary>
  );
};

export default Page;
