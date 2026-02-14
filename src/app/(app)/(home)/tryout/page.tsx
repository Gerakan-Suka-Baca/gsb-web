import { TryoutListView } from "@/modules/tryouts/ui/views/tryout-list-view";
import { caller, getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";

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
  const session = await caller.auth.session();

  if (!session.user) {
    redirect("/sign-in");
  }

  void queryClient.prefetchQuery(trpc.tryouts.getMany.queryOptions({}));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TryoutListView />
    </HydrationBoundary>
  );
};

export default Page;
