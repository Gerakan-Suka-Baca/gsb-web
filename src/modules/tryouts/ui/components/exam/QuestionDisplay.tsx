import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/utils";
import type { Question } from "@/payload-types";

type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type SubtestAnswer = NonNullable<SubtestQuestion["tryoutAnswers"]>[number];

interface QuestionDisplayProps {
  question: SubtestQuestion;
  index: number;
  userAnswer?: string;
  isFlagged: boolean;
  onAnswer: (qId: string, aId: string) => void;
  onFlag: (qId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  onFinishSubtest: () => void;
}

export const QuestionDisplay = memo(({ question, index, userAnswer, isFlagged, onAnswer, onFlag, onNext, onPrev, isFirst, isLast, onFinishSubtest }: QuestionDisplayProps) => {
  const qID = question.id || `q-${index}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={qID}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-col gap-3 md:gap-6"
      >
        <Card className="p-4 md:p-8 flex flex-col gap-4 md:gap-6 border-t-4 border-t-gsb-orange shadow-lg">
          <div className="flex justify-between items-start border-b border-border/50 pb-3 md:pb-4">
            <div className="text-lg md:text-xl font-heading font-bold text-gsb-maroon">Soal No. {index + 1}</div>
            <Button
              variant={isFlagged ? "secondary" : "outline"}
              size="sm"
              onClick={() => onFlag(qID)}
              className={cn("gap-1.5 md:gap-2 select-none text-xs md:text-sm", isFlagged && "bg-yellow-100 text-yellow-900 hover:bg-yellow-200")}
            >
              <Flag className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isFlagged && "fill-current")} />
              {isFlagged ? "Ditandai" : "Tandai"}
            </Button>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-lg border border-border/50 min-h-[60px] md:min-h-[100px]">
            <RichText content={question.question} className="prose-sm md:prose-base leading-relaxed" />
          </div>

          <div className="flex flex-col gap-2 md:gap-3 mt-2 md:mt-4">
            {question.tryoutAnswers?.map((opt: SubtestAnswer, idx: number) => {
              const optID = opt.id || `opt-${idx}`;
              const isSelected = userAnswer === optID;
              const char = String.fromCharCode(65 + idx);
              return (
                <motion.div
                  key={optID}
                  whileHover={{ scale: 1.005, backgroundColor: "rgba(255, 247, 237, 0.5)" }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => onAnswer(qID, optID)}
                  className={cn(
                    "flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-colors duration-200 select-none",
                    isSelected ? "border-gsb-orange bg-orange-50/80 shadow-sm" : "border-border hover:border-gsb-orange/30"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 font-bold border transition-colors text-sm md:text-base",
                    isSelected ? "bg-gsb-orange text-white border-gsb-orange" : "bg-white text-muted-foreground border-gray-300"
                  )}>
                    {char}
                  </div>
                  <div className="pt-0.5 text-sm md:text-base w-full">
                    <RichText content={opt.answer} className="prose-sm" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-between mt-2 md:mt-4 pb-4 md:pb-8">
          <Button variant="outline" onClick={onPrev} disabled={isFirst} className="h-9 md:h-11 px-4 md:px-6 rounded-full border-2 select-none text-sm">
            <ChevronLeft className="w-4 h-4 mr-1 md:mr-2" /> Sebelumnya
          </Button>
          {!isLast ? (
            <Button onClick={onNext} className="bg-gsb-orange hover:bg-gsb-orange/90 text-white h-9 md:h-11 px-5 md:px-8 rounded-full shadow-md transition-transform hover:scale-105 select-none text-sm">
              Selanjutnya <ChevronRight className="w-4 h-4 ml-1 md:ml-2" />
            </Button>
          ) : (
            <Button variant="destructive" onClick={onFinishSubtest} className="h-9 md:h-11 px-5 md:px-8 rounded-full shadow-md bg-gsb-red hover:bg-gsb-red/90 transition-transform hover:scale-105 select-none text-sm">
              Selesai Subtes
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
QuestionDisplay.displayName = "QuestionDisplay";
