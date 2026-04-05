import { Metadata } from "next";
import { MentorDashboardView } from "@/modules/mentor-dashboard/ui/views/MentorDashboardView";

export const metadata: Metadata = {
  title: "Mentor Dashboard - Gema Simpul Berdaya",
  description: "Dashboard akses tertutup mentor untuk melihat analisis tryout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MentorDashboardPage() {
  return (
    <main className="min-h-screen bg-muted/20 pb-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 pt-24">
        <MentorDashboardView />
      </div>
    </main>
  );
}
