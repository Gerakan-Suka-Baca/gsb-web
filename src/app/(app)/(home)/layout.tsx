import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ExamNavbarProvider } from "@/components/layout/exam-navbar-context";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPayloadCached } from "@/lib/payload";
import { redirect } from "next/navigation";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const buildUserSeed = (userId: string, clerkUser: Awaited<ReturnType<typeof currentUser>>) => {
  const emailAddresses = clerkUser?.emailAddresses ?? [];
  const primaryId = clerkUser?.primaryEmailAddressId;
  const primaryEntry = primaryId ? emailAddresses.find((e) => e.id === primaryId) : null;
  const rawEmail = (primaryEntry?.emailAddress ?? emailAddresses[0]?.emailAddress ?? "").trim();
  const email = isValidEmail(rawEmail)
    ? rawEmail
    : `user-${userId.replace(/[^a-zA-Z0-9]/g, "-")}@example.com`;
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim();
  const usernameBase = clerkUser?.username ?? (rawEmail ? rawEmail.split("@")[0] : null) ?? userId;
  const username = String(usernameBase).replace(/\s+/g, "-").slice(0, 64) || userId;

  return { email, fullName, username };
};

const ensureUserRecord = async (payload: Awaited<ReturnType<typeof getPayloadCached>>, userId: string) => {
  const { docs } = await payload.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });
  let user = docs[0];

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }
    const { email, fullName, username } = buildUserSeed(userId, clerkUser);
    try {
      user = await payload.create({
        collection: "users",
        data: {
          clerkUserId: userId,
          email,
          fullName,
          username,
          roles: ["user"],
          profileCompleted: false,
        },
      });
    } catch (error) {
      const msg = String(error instanceof Error ? error.message : error);
      const isEmailError = /email|invalid|duplicate|unique/i.test(msg);
      if (isEmailError) {
        const byEmail = await payload.find({
          collection: "users",
          where: { email: { equals: email } },
          limit: 1,
        });
        const existingByEmail = byEmail.docs[0] as { id: string; clerkUserId?: string | null } | undefined;
        if (existingByEmail) {
          if (!existingByEmail.clerkUserId || existingByEmail.clerkUserId === userId) {
            await payload.update({
              collection: "users",
              id: existingByEmail.id,
              data: { clerkUserId: userId, email, fullName, username },
            });
            user = await payload.findByID({ collection: "users", id: existingByEmail.id });
          }
        }
      }
    }
  }

  return user ?? null;
};

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await auth();
  const { userId } = authResult;
  if (userId) {
    const payload = await getPayloadCached();
    const user = await ensureUserRecord(payload, userId);
    if (user && !user.profileCompleted) redirect("/complete-profile");
  }
  return (
    <ExamNavbarProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ExamNavbarProvider>
  );
}
