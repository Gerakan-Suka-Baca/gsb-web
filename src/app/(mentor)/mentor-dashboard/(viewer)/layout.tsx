import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPayloadCached } from "@/lib/payload";

const ALLOWED_MENTOR_ROLES = ["super-admin", "admin", "volunteer"] as const;

export default async function MentorViewerLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const payload = await getPayloadCached();
  
  // Authenticate the request against the Payload admins collection.
  const { user } = await payload.auth({ headers: reqHeaders });

  if (!user || user.collection !== "admins") {
    redirect("/mentor-dashboard/login");
  }

  const role = (user as any).role;
  if (!ALLOWED_MENTOR_ROLES.includes(role)) {
    redirect("/mentor-dashboard/login?error=forbidden");
  }

  return <>{children}</>;
}
