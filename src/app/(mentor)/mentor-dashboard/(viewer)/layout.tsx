import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPayloadCached } from "@/lib/payload";

export default async function MentorViewerLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const payload = await getPayloadCached();
  
  // Authenticate against Payload Admis collection
  const { user } = await payload.auth({ headers: reqHeaders });

  if (!user || user.collection !== "admins") {
    redirect("/mentor-dashboard/login");
  }

  const role = (user as any).role;
  if (!["super-admin", "admin", "volunteer"].includes(role)) {
    redirect("/mentor-dashboard/login?error=forbidden");
  }

  return <>{children}</>;
}
