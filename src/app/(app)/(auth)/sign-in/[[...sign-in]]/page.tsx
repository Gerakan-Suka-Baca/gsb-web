import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInView } from "@/modules/auth/ui/views/SignInView";

export const dynamic = "force-dynamic";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) => {
  const params = await searchParams;
  const { userId } = await auth();
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : null;

  if (userId) {
    redirect(callbackUrl || "/tryout");
  }

  return <SignInView />;
};

export default Page;
