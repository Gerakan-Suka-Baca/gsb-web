import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const ANIM = {
  fadeSlide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  },
} as const;

interface ExamFinishedProps {
  title?: string;
  description?: string;
  showButton?: boolean;
  buttonLabel?: string;
  isLoading?: boolean;
  onButtonClick?: () => void;
}

export const ExamFinished = ({
  title = "Ujian Selesai!",
  description = "Jawaban Anda telah tersimpan.",
  showButton = true,
  buttonLabel = "Kembali ke Dashboard",
  isLoading = false,
  onButtonClick,
}: ExamFinishedProps) => {
  const router = useRouter();
  
  return (
      <motion.div {...ANIM.fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-md w-full p-8 border-none shadow-xl bg-green-50">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-green-700" /> : "🎉"}
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">{title}</h2>
          <p className="text-green-700 mb-6">{description}</p>
          {showButton && (
            <Button onClick={onButtonClick ?? (() => router.push("/tryout"))} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {buttonLabel}
            </Button>
          )}
        </Card>
      </motion.div>
  );
};
