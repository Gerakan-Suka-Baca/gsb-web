import { Metadata } from "next";
import { MentorLeaderboardView } from "@/modules/mentor-dashboard/ui/views/MentorLeaderboardView";

export const metadata: Metadata = {
  title: "Leaderboard Peserta | Mentor Intelligence System",
  description: "Peringkat dan peringkat peserta Tryout GSB.",
};

export default function MentorLeaderboardPage() {
  return <MentorLeaderboardView />;
}
