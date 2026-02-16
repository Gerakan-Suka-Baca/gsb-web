import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";
import { Navigator } from "./Navigator";
import type { Question } from "@/payload-types";

type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

interface ExamSidebarProps {
  timeLeft: number;
  formatTime: (seconds: number) => string;
  subtestLabel: string;
  questions: SubtestQuestion[];
  currentSubtestId: string;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
}

export const ExamSidebar = ({
  timeLeft,
  formatTime,
  subtestLabel,
  questions,
  currentSubtestId,
  answers,
  flags,
  currentQuestionIndex,
  setCurrentQuestionIndex,
}: ExamSidebarProps) => {
  return (
    <div className="lg:col-span-1 flex flex-col gap-6">

      <Card className="hidden lg:flex flex-col p-6 bg-slate-900 text-white sticky top-20 shadow-2xl border-slate-800 select-none rounded-xl">
        <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">
          Sisa Waktu
        </span>
        <div className={cn("text-4xl font-mono font-bold", timeLeft < 60 && "text-gsb-red animate-pulse")} >
          {formatTime(timeLeft)}
        </div>
        <div className="mt-2 text-sm text-slate-300 border-t border-slate-700 pt-2">
          {subtestLabel}
        </div>
      </Card>


      <Card className="p-5 hidden lg:block border shadow-sm sticky top-64 select-none rounded-xl">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <LayoutGrid className="w-4 h-4 text-gsb-blue" />
          <h3 className="font-semibold text-gsb-blue">Navigasi Soal</h3>
        </div>
        
        <Navigator
          questions={questions}
          currentSubtestId={currentSubtestId}
          answers={answers}
          flags={flags}
          currentIndex={currentQuestionIndex}
          onSelect={setCurrentQuestionIndex}
        />

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gsb-blue rounded" /> Sedang Dikerjakan
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gsb-tosca rounded" /> Sudah Dijawab
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-gsb-yellow rounded" /> Ditandai
          </div>
        </div>
      </Card>
    </div>
  );
};
