import { MentorQuestionAnalysisView } from "@/modules/mentor-dashboard/ui/views/MentorQuestionAnalysisView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analisis Butir Soal | Mentor Dashboard",
  description: "Analisis performa per nomor soal untuk setiap paket tryout.",
};

export default function QuestionAnalysisPage() {
  return <MentorQuestionAnalysisView />;
}
