import { CompleteProfileView } from "@/modules/auth/ui/views/complete-profile-view";
import { auth } from "@clerk/nextjs/server";
import { getPayloadCached } from "@/lib/payload";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Lengkapi Profil - Gema Simpul Berdaya",
  description: "Lengkapi data diri Anda untuk melanjutkan.",
};

export default async function CompleteProfilePage() {
  const [{ userId }, payload] = await Promise.all([auth(), getPayloadCached()]);
  if (!userId) redirect("/sign-in");
  const existingUsers = await payload.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });
  const user = existingUsers.docs[0];
  if (user?.profileCompleted) {
    redirect("/profile");
  }
  return <CompleteProfileView />;
}
