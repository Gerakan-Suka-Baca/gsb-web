import { memo } from "react";
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
  <div className="flex flex-wrap gap-2 justify-center content-start">
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
        <button key={idx} onClick={() => onSelect(idx)} className={cn("w-9 h-9 text-xs rounded-md flex items-center justify-center font-bold border transition-colors", variant)}>
          {idx + 1}
        </button>
      );
    })}
  </div>
));
Navigator.displayName = "Navigator";
