import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LayoutGrid, Clock } from "lucide-react";
import { Navigator } from "./Navigator";
import { useState, useEffect } from "react";
import { useExamNavbar } from "@/components/layout/exam-navbar-context";
import type { Question } from "@/payload-types";

type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

interface MobileExamControlsProps {
  timeLeft: number;
  formatTime: (seconds: number) => string;
  questions: SubtestQuestion[];
  currentSubtestId: string;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
}

export const MobileExamControls = ({
  timeLeft,
  formatTime,
  questions,
  currentSubtestId,
  answers,
  flags,
  currentQuestionIndex,
  setCurrentQuestionIndex,
}: MobileExamControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const { setExamNavbarContent } = useExamNavbar();

  useEffect(() => {
    setIsWarning(timeLeft < 60);
  }, [timeLeft]);

  const handleSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsOpen(false);
  };

  useEffect(() => {
    setExamNavbarContent(
      <div className="flex items-center gap-3 md:gap-6">
        {/* Timer */}
        <div className={cn(
            "flex items-center gap-2 font-mono font-bold text-base md:text-lg tabular-nums bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50",
            isWarning ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-slate-700"
        )}>
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Navigation Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-gsb-blue text-gsb-blue hover:bg-gsb-blue/10">
                    <LayoutGrid className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                <SheetHeader className="mb-6 text-left">
                    <SheetTitle>Navigasi Soal</SheetTitle>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-600 rounded" /> Aktif
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-600 rounded" /> Dijawab
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded" /> Ragu
                        </div>
                    </div>
                </SheetHeader>
                <div className="overflow-y-auto max-h-[60vh] pb-8">
                    <Navigator
                        questions={questions}
                        currentSubtestId={currentSubtestId}
                        answers={answers}
                        flags={flags}
                        currentIndex={currentQuestionIndex}
                        onSelect={handleSelect}
                    />
                </div>
            </SheetContent>
        </Sheet>
      </div>
    );

    return () => setExamNavbarContent(null);
  }, [timeLeft, isWarning, isOpen, formatTime, questions, currentSubtestId, answers, flags, currentQuestionIndex, setExamNavbarContent]);

  return null;
};
