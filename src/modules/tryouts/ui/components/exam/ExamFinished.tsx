import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const ANIM = {
  fadeSlide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  },
} as const;

export const ExamFinished = () => {
  const router = useRouter();
  
  return (
      <motion.div {...ANIM.fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-md w-full p-8 border-none shadow-xl bg-green-50">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
          </motion.div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Ujian Selesai!</h2>
          <p className="text-green-700 mb-6">Jawaban Anda telah tersimpan.</p>
          <Button onClick={() => router.push("/tryout")} className="w-full bg-green-600 hover:bg-green-700 text-white">Kembali ke Dashboard</Button>
        </Card>
      </motion.div>
  );
};
