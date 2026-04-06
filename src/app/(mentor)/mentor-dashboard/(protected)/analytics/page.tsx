import { getPayloadCached } from "@/lib/payload";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MentorAnalyticsView } from "@/modules/mentor-dashboard/ui/views/MentorAnalyticsView";

const ALLOWED_MENTOR_ROLES = ["super-admin", "admin", "volunteer"] as const;

export const metadata = {
  title: "Status Pengerjaan & Pembayaran | Dashboard Mentor",
  description: "Pantau status pengerjaan subtest dan rilis skor tryout siswa",
};

export default async function MentorAnalyticsPage() {
  const reqHeaders = await headers();
  const payload = await getPayloadCached();
  
  const { user } = await payload.auth({ headers: reqHeaders });

  if (!user || user.collection !== "admins") {
    redirect("/mentor-dashboard/login");
  }

  const role = (user as any).role;
  if (!ALLOWED_MENTOR_ROLES.includes(role)) {
    notFound();
  }

  return <MentorAnalyticsView />;
}
