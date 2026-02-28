import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUpView } from "@/modules/auth/ui/views/SignUpView";

export const dynamic = "force-dynamic";

const Page = async () => {
  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  return <SignUpView />;
};

export default Page;
