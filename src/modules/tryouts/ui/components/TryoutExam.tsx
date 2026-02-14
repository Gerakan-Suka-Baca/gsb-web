"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/utils";
import { Question, Tryout } from "@/payload-types";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Timer,
  LayoutGrid, // Keep LayoutGrid for the navigation grid
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TryoutExamProps {
  tryout: Tryout;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

type AnswerMap = Record<string, string>; // questionID -> answerID
type FlagMap = Record<string, boolean>; // questionID -> boolean

export const TryoutExam = ({ tryout, onFinish }: TryoutExamProps) => {
  // Data: Ensure questions are populated (handled by depth in getOne)
  const subtests = (tryout.questions as Question[]) || [];

  const [currentSubtestIndex, setCurrentSubtestIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerMap>>({});
  const [flags, setFlags] = useState<Record<string, FlagMap>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [examState, setExamState] = useState<"ready" | "running" | "finished">("ready");

  const currentSubtest = subtests[currentSubtestIndex];
  const questions = currentSubtest?.tryoutQuestions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Initialize Timer when Subtest starts
  useEffect(() => {
    if (examState === "running" && currentSubtest) {
      setTimeLeft(currentSubtest.duration * 60); // Convert minutes to seconds
    }
  }, [examState, currentSubtest]);

  const handleSubtestFinish = useCallback(() => {
    if (currentSubtestIndex < subtests.length - 1) {
      setCurrentSubtestIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setExamState("ready");
    } else {
      setExamState("finished");
      onFinish(answers);
    }
  }, [currentSubtestIndex, subtests.length, answers, onFinish]);

  // Timer Countdown
  useEffect(() => {
    if (examState !== "running" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubtestFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, handleSubtestFinish, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentSubtest.id]: {
        ...(prev[currentSubtest.id] || {}),
        [questionId]: answerId,
      },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlags((prev) => ({
      ...prev,
      [currentSubtest.id]: {
        ...(prev[currentSubtest.id] || {}),
        [questionId]: !prev[currentSubtest.id]?.[questionId],
      },
    }));
  };

  /* -------------------------------------------------------------------------- */
  /*                                 RENDER VIEW                                */
  /* -------------------------------------------------------------------------- */

  if (examState === "ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-2">
            Subtes {currentSubtestIndex + 1}: {currentSubtest?.title}
            </h2>
            <div className="w-20 h-1 bg-gsb-orange rounded-full mx-auto mb-8"></div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Durasi</span>
                    <span className="text-2xl font-bold text-gsb-blue">{currentSubtest?.duration} Menit</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Jumlah Soal</span>
                    <span className="text-2xl font-bold text-gsb-blue">{questions.length} Butir</span>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-8 flex gap-3 text-left">
                <div className="shrink-0 mt-0.5">⚠️</div>
                <p>Waktu akan berjalan segera setelah Anda menekan tombol mulai. Tidak ada jeda selama pengerjaan subtes.</p>
            </div>

            <Button size="lg" onClick={() => setExamState("running")} className="w-full md:w-auto px-12 h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all">
            Mulai Subtes Ini
            </Button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return <div>Loading Soal...</div>;

  const currentQID = currentQuestion.id || `q-${currentQuestionIndex}`;
  const currentAns = answers[currentSubtest.id]?.[currentQID];
  const isFlagged = flags[currentSubtest.id]?.[currentQID];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[80vh]">
      {/* LEFT/TOP PANEL: Question & Options */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Header Mobile: Timer */}
        <div className="flex lg:hidden justify-between items-center bg-card p-4 rounded-lg border shadow-sm sticky top-20 z-10">
            <div className="font-semibold">{currentSubtest.subtest}</div>
            <div className={`font-mono text-xl font-bold flex gap-2 items-center ${timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}`}>
                <Timer className="w-5 h-5" />
                {formatTime(timeLeft)}
            </div>
        </div>

        {/* Question Card */}
        <Card className="p-6 md:p-8 flex flex-col gap-6 border-t-4 border-t-gsb-orange shadow-lg">
            <div className="flex justify-between items-start border-b border-border/50 pb-4">
                <div className="text-xl font-heading font-bold text-gsb-maroon">
                    Soal No. {currentQuestionIndex + 1}
                </div>
                <Button 
                    variant={isFlagged ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => toggleFlag(currentQID)}
                    className={cn("gap-2", isFlagged && "bg-yellow-100 text-yellow-900 hover:bg-yellow-200")}
                >
                    <Flag className={`w-4 h-4 ${isFlagged ? "fill-current" : ""}`} />
                    {isFlagged ? "Ditandai" : "Tandai Ragu"}
                </Button>
            </div>

            {/* Question Content */}
             <div className="bg-white p-4 rounded-lg border border-border/50">
                 <RichText content={currentQuestion.question} />
             </div>

             {/* Options */}
             <div className="flex flex-col gap-3 mt-4">
                 {currentQuestion.tryoutAnswers?.map((opt, idx) => {
                     const optID = opt.id || `opt-${idx}`;
                     const isSelected = currentAns === optID;
                     const char = String.fromCharCode(65 + idx); // A, B, C...

                     return (
                         <div 
                            key={optID}
                            onClick={() => handleAnswer(currentQID, optID)}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                isSelected 
                                    ? "border-gsb-orange bg-orange-50/50 shadow-md transform scale-[1.01]" 
                                    : "border-border hover:border-gsb-orange/30 hover:bg-muted/30"
                            )}
                         >
                             <div className={cn(
                                 "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold border transition-colors",
                                 isSelected ? "bg-gsb-orange text-white border-gsb-orange" : "bg-white text-muted-foreground border-gray-300 group-hover:border-gsb-orange/50"
                             )}>
                                 {char}
                             </div>
                             <div className="pt-0.5 text-base w-full">
                                 <RichText content={opt.answer} />
                             </div>
                         </div>
                     )
                 })}
             </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-auto pt-4">
            <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="h-11 px-6 rounded-full"
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Sebelumnya
            </Button>
            
            {currentQuestionIndex < questions.length - 1 ? (
                <Button
                     onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                     className="bg-gsb-orange hover:bg-gsb-orange/90 text-white h-11 px-8 rounded-full shadow-md"
                >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            ) : (
                <Button 
                    variant="destructive"
                    onClick={handleSubtestFinish}
                    className="h-11 px-8 rounded-full shadow-md bg-gsb-red hover:bg-gsb-red/90"
                >
                    Selesai Subtes Ini
                </Button>
            )}
        </div>
      </div>

      {/* RIGHT PANEL: Navigator & Info */}
      <div className="lg:col-span-1 flex flex-col gap-6">
           {/* Desktop Timer */}
           <Card className="hidden lg:flex flex-col p-4 bg-slate-900 text-white sticky top-24">
                <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Sisa Waktu</span>
                <div className={`text-4xl font-mono font-bold ${timeLeft < 60 ? 'text-red-400 animate-pulse' : ''}`}>
                    {formatTime(timeLeft)}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                    {currentSubtest.subtest}
                </div>
           </Card>

           {/* Number Grid */}
           <Card className="p-4">
               <div className="flex items-center gap-2 mb-4">
                   <LayoutGrid className="w-4 h-4" />
                   <h3 className="font-semibold">Navigasi Soal</h3>
               </div>
               <div className="grid grid-cols-5 gap-2">
                   {questions.map((_, idx) => {
                       const qID = questions[idx].id || `q-${idx}`;
                       const isAns = answers[currentSubtest.id]?.[qID];
                       const isFlg = flags[currentSubtest.id]?.[qID];
                       const isCurr = currentQuestionIndex === idx;

                       let variant = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
                       if (isCurr) variant = "bg-blue-600 text-white border-blue-600";
                       else if (isFlg) variant = "bg-yellow-400 text-yellow-900 border-yellow-400";
                       else if (isAns) variant = "bg-green-600 text-white border-green-600";

                       return (
                           <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={cn(
                                    "w-full aspect-square rounded flex items-center justify-center text-sm font-medium border transition-all",
                                    variant
                                )}
                           >
                               {idx + 1}
                           </button>
                       )
                   })}
               </div>
               
               <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
                   <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-blue-600 rounded"></div> Sedang Dikerjakan
                   </div>
                   <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-600 rounded"></div> Sudah Dijawab
                   </div>
                   <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-yellow-400 rounded"></div> Ragu-ragu
                   </div>
                   <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div> Belum Dijawab
                   </div>
               </div>
           </Card>
      </div>
    </div>
  );
};
