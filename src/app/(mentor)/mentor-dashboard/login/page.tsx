import { Suspense } from "react";
import { Metadata } from "next";
import { MentorLoginView } from "@/modules/mentor-dashboard/ui/views/MentorLoginView";

export const metadata: Metadata = {
  title: "Mentor Login - Gema Simpul Berdaya",
  description: "Masuk ke area khusus Mentor & Admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MentorLoginPage() {
  return (
    <main className="min-h-screen">
      <Suspense>
        <MentorLoginView />
      </Suspense>
    </main>
  );
}
