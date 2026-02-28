import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, Clock, X } from "lucide-react";
import { ExamNavigator } from "./ExamNavigator";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useExamNavbar } from "@/components/layout/exam-navbar-context";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@/payload-types";

type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

interface ExamMobileControlsProps {
  timeLeft: number;
  formatTime: (seconds: number) => string;
  questions: SubtestQuestion[];
  currentSubtestId: string;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
}

export const ExamMobileControls = ({
  timeLeft,
  formatTime,
  questions,
  currentSubtestId,
  answers,
  flags,
  currentQuestionIndex,
  setCurrentQuestionIndex,
}: ExamMobileControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const { setExamNavbarContent } = useExamNavbar();

  useEffect(() => {
    setIsWarning(timeLeft < 60);
  }, [timeLeft]);

  const handleSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setCurrentQuestionIndex]);

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const answeredCount = useMemo(() => {
    return currentSubtestId ? Object.keys(answers[currentSubtestId] || {}).length : 0;
  }, [answers, currentSubtestId]);

  const overlay = useMemo(() => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="nav-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-4 border-b border-border/50">
              <div>
                <h3 className="text-lg font-bold text-gsb-maroon">Navigasi Soal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {answeredCount}/{questions.length} soal dijawab
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="shrink-0 bg-gsb-orange/10 hover:bg-gsb-orange/20 text-gsb-orange rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Legend */}
            <div className="flex gap-4 px-5 py-2.5 text-[11px] text-muted-foreground bg-muted/30">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gsb-blue rounded-sm" /> Aktif
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gsb-tosca rounded-sm" /> Dijawab
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gsb-yellow rounded-sm" /> Ragu
              </div>
            </div>

            {/* Navigator grid */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <ExamNavigator
                questions={questions}
                currentSubtestId={currentSubtestId}
                answers={answers}
                flags={flags}
                currentIndex={currentQuestionIndex}
                onSelect={handleSelect}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [isOpen, questions, currentSubtestId, answers, flags, currentQuestionIndex, handleSelect, answeredCount]);

  useEffect(() => {
    setExamNavbarContent(
      <div className="flex items-center gap-3 md:gap-6">
        {/* Timer */}
        <div className={cn(
            "flex items-center gap-2 font-mono font-bold text-base md:text-lg tabular-nums bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50",
            isWarning ? "text-gsb-red bg-gsb-red/10 border-gsb-red/20 animate-pulse" : "text-slate-700"
        )}>
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Navigator trigger */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleOpen}
          className="h-9 w-9 rounded-full border-gsb-blue text-gsb-blue hover:bg-gsb-blue/10"
        >
          <LayoutGrid className="w-5 h-5" />
        </Button>
      </div>
    );

    return () => setExamNavbarContent(null);
  }, [timeLeft, isWarning, formatTime, toggleOpen, setExamNavbarContent]);

  return overlay;
};
