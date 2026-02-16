import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";
import { caller } from "@/trpc/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const session = await caller.auth.session();

  if (session.user) {
    const params = await searchParams;
    const callbackUrl = (params.callbackUrl as string) || "/";
    redirect(callbackUrl);
  }

  return <SignUpView />;
};

export default Page;
