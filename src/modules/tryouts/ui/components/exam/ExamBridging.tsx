import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Question } from "@/payload-types";

const ANIM = {
  fadeSlide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  },
  staggerContainer: { animate: { transition: { staggerChildren: 0.08 } } },
  staggerChild: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
} as const;

type AnswerMap = Record<string, string>;

interface ExamBridgingProps {
  currentSubtestIndex: number;
  questions: Question[];
  answers: Record<string, AnswerMap>;
  subtestLabels: Record<string, string>;
  bridgingSeconds: number;
  onNextSubtest: () => void;
}

export const ExamBridging = ({
  currentSubtestIndex,
  questions,
  answers,
  subtestLabels,
  bridgingSeconds,
  onNextSubtest,
}: ExamBridgingProps) => {
  const completedSubtest = questions[currentSubtestIndex];
  const nextSubtest = questions[currentSubtestIndex + 1];

  return (
      <motion.div {...ANIM.fadeSlide} className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8">
        <motion.div variants={ANIM.staggerContainer} initial="initial" animate="animate" className="max-w-2xl w-full space-y-8">
          <motion.div variants={ANIM.staggerChild}>
            <Card className="p-8 bg-gsb-tosca/5 border-gsb-tosca/20 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-8 h-8 text-gsb-tosca" />
                <div>
                  <h3 className="text-lg font-bold text-gsb-tosca">Subtes {currentSubtestIndex + 1} Selesai!</h3>
                  <p className="text-muted-foreground text-sm">{completedSubtest?.title} — {completedSubtest?.subtest ? (subtestLabels[completedSubtest.subtest as string] || completedSubtest.subtest) : ""}</p>
                </div>
              </div>
              <div className="text-sm text-gsb-tosca bg-gsb-tosca/10 rounded-lg p-3">
                Kamu menjawab <span className="font-bold">{Object.keys(answers[completedSubtest?.id] || {}).length}</span> dari <span className="font-bold">{completedSubtest?.tryoutQuestions?.length || 0}</span> soal.
              </div>
            </Card>
          </motion.div>
          {nextSubtest && (
            <motion.div variants={ANIM.staggerChild}>
              <Card className="p-8 border border-border shadow-lg bg-card">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes Selanjutnya</p>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-gsb-maroon">{nextSubtest.title}</h2>
                  <p className="text-gsb-blue font-medium mt-1">{nextSubtest?.subtest ? (subtestLabels[nextSubtest.subtest as string] || nextSubtest.subtest) : ""}</p>
                  <div className="w-16 h-1 bg-gsb-orange rounded-full mx-auto mt-3" />
                </div>
                <div className="flex justify-center mb-6">
                  <div className="text-sm font-semibold text-orange-600 bg-orange-100 px-4 py-1.5 rounded-full">Waktu jeda: {bridgingSeconds} detik</div>
                </div>
                 <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1 text-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Durasi</span>
                    <span className="text-xl font-bold text-gsb-blue">{nextSubtest.duration} Menit</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1 text-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Soal</span>
                    <span className="text-xl font-bold text-gsb-blue">{nextSubtest.tryoutQuestions?.length || 0} Butir</span>
                  </div>
                </div>
                <Button size="lg" onClick={onNextSubtest} className="w-full h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange hover:brightness-110 text-white rounded-full shadow-lg">
                    Mulai Subtes Berikutnya <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
  );
};
