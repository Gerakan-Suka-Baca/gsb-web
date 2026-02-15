import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/payload-types";

type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

interface NavigatorProps {
  questions: SubtestQuestion[];
  currentSubtestId: string;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentIndex: number;
  onSelect: (index: number) => void;
}

export const Navigator = memo(({ questions, currentSubtestId, answers, flags, currentIndex, onSelect }: NavigatorProps) => (
  <div className="grid grid-cols-5 sm:grid-cols-7 lg:flex lg:flex-wrap gap-2 justify-center content-start">
    {questions.map((q: SubtestQuestion, idx: number) => {
      const qID = q.id || `q-${idx}`;
      const isAns = answers[currentSubtestId]?.[qID];
      const isFlg = flags[currentSubtestId]?.[qID];
      const isCurr = currentIndex === idx;

      let variant = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
      if (isCurr) variant = "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100";
      else if (isFlg) variant = "bg-yellow-400 text-yellow-900 border-yellow-400";
      else if (isAns) variant = "bg-green-600 text-white border-green-600";

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
Navigator.displayName = "Navigator";
