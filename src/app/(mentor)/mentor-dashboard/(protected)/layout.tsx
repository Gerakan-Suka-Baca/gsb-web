import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPayloadCached } from "@/lib/payload";
import { MentorNavbar } from "@/modules/mentor-dashboard/ui/components/MentorNavbar";

const ALLOWED_MENTOR_ROLES = ["super-admin", "admin", "volunteer"] as const;

export default async function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
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

  const adminName = (user as any).name || user.email || "Admin";

  return (
    <div className="min-h-screen bg-muted/20 relative">
      <MentorNavbar adminName={adminName} />
      <div className="pt-20 pb-20 px-4 sm:px-6 max-w-[1400px] mx-auto">
         {children}
      </div>
    </div>
  );
}
