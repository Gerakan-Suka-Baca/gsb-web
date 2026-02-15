import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/payload-types";

interface ExamHeaderProps {
  currentSubtestIndex: number;
  subtests: Question[];
  currentSubtestTitle?: string;
}

export const ExamHeader = ({ currentSubtestIndex, subtests, currentSubtestTitle }: ExamHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="mb-3 md:mb-8 rounded-xl bg-gradient-to-r from-gsb-maroon to-gsb-red px-4 md:px-6 py-3 md:py-4 flex items-center justify-between text-white shadow-xl"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="bg-white/20 rounded-full px-2 md:px-3 py-0.5 text-xs font-bold shrink-0">
          Subtes {currentSubtestIndex + 1}/{subtests.length}
        </span>
        <span className="font-semibold text-xs md:text-sm line-clamp-1">
          {currentSubtestTitle}
        </span>
      </div>
      <div className="flex gap-1">
        {subtests.map((_, idx) => (
          <div 
            key={idx} 
            className={cn(
              "w-2 h-2 rounded-full", 
              idx === currentSubtestIndex ? "bg-white" : idx < currentSubtestIndex ? "bg-green-400" : "bg-white/30"
            )} 
          />
        ))}
      </div>
    </motion.div>
  );
};
