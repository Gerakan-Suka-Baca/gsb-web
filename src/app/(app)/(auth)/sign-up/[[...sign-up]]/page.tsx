import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUpView } from "@/modules/auth/ui/views/SignUpView";

export const dynamic = "force-dynamic";

const Page = async ({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) => {
  const { userId } = await auth();
  const resolvedSearchParams = await searchParams;
  const callbackUrl =
    typeof resolvedSearchParams?.callbackUrl === "string" ? resolvedSearchParams.callbackUrl : null;

  if (userId) {
    redirect(callbackUrl || "/tryout");
  }

  return <SignUpView />;
};

export default Page;
