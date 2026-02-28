import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/payload-types";

type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

interface ExamNavigatorProps {
  questions: SubtestQuestion[];
  currentSubtestId: string;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentIndex: number;
  onSelect: (index: number) => void;
}

export const ExamNavigator = memo(({ questions, currentSubtestId, answers, flags, currentIndex, onSelect }: ExamNavigatorProps) => (
  <div className="grid grid-cols-5 sm:grid-cols-7 lg:flex lg:flex-wrap gap-2 justify-center content-start">
    {questions.map((q: SubtestQuestion, idx: number) => {
      const qID = q.id || `q-${idx}`;
      const isAns = answers[currentSubtestId]?.[qID];
      const isFlg = flags[currentSubtestId]?.[qID];
      const isCurr = currentIndex === idx;

      let variant = "bg-white border-border/50 text-muted-foreground hover:bg-muted";
      if (isCurr) variant = "bg-gsb-blue text-white border-gsb-blue shadow-md ring-2 ring-gsb-blue/20";
      else if (isFlg) variant = "bg-gsb-yellow text-gsb-yellow-foreground border-gsb-yellow";
      else if (isAns) variant = "bg-gsb-tosca text-white border-gsb-tosca";

      return (
        <motion.button
          key={idx}
          onClick={() => onSelect(idx)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className={cn("w-full aspect-square max-w-11 text-sm rounded-lg flex items-center justify-center font-bold border transition-colors lg:w-9 lg:h-9 lg:text-xs lg:rounded-md", variant)}
        >
          {idx + 1}
        </motion.button>
      );
    })}
  </div>
));
ExamNavigator.displayName = "ExamNavigator";
