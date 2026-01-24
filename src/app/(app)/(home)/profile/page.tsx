import { Button } from "@/components/ui/button";
import { caller } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await caller.auth.session();

  if (!session.user) {
    redirect("/sign-in");
  }

  const user = session.user;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-2">{user.username}</h2>
        <p className="text-gray-600 mb-2">{user.email}</p>
        <p className="text-sm text-gray-500 mb-2">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
        <p className="text-gray-600 mb-2">Skor Try Out:</p>

        <Button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Lihat Pembahasan
        </Button>
      </div>
    </div>
  );
}
