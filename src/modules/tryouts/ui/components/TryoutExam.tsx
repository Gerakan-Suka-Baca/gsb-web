"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { QuestionDisplay } from "./exam/QuestionDisplay";
import { ExamHeader } from "./exam/ExamHeader";
import { ExamSidebar } from "./exam/ExamSidebar";
import { ExamDialogs } from "./exam/ExamDialogs";
import { MobileExamControls } from "./exam/MobileExamControls";
import { ExamBridging } from "./exam/ExamBridging";
import { ExamFinished } from "./exam/ExamFinished";
import { useTryoutExam } from "../hooks/useTryoutExam";
import type { Tryout, Question } from "@/payload-types";

// Animation variants
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
const SUBTEST_LABELS: Record<string, string> = {
  PU: "Penalaran Umum", PK: "Pengetahuan Kuantitatif", PM: "Penalaran Matematika",
  LBE: "Literasi Bahasa Inggris", LBI: "Literasi Bahasa Indonesia",
  PPU: "Pengetahuan & Pemahaman Umum", KMBM: "Kemampuan Memahami Bacaan & Menulis",
};

interface TryoutExamProps {
  tryout: Tryout;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

export const TryoutExam = ({ tryout, onFinish }: TryoutExamProps) => {
  
  const {
      currentSubtestIndex,
      currentQuestionIndex,
      answers,
      flags,
      timeLeft,
      examState,
      isSubmitting,
      isAttemptLoading,
      attemptId,
      currentSubtest,
      currentSubtestId,
      questions,
      currentQuestion,
      setCurrentQuestionIndex,
      startAttempt,
      handleNextSubtest,
      handleAnswer,
      toggleFlag,
      finishExam,
      doSave,
      setExamState // Exposed for bridging manual override if needed
  } = useTryoutExam(tryout, onFinish);

  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [bridgingSeconds, setBridgingSeconds] = useState(60);


  useEffect(() => {
    if (examState !== "running") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && attemptId) {
        doSave(true);
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    const handlePopState = () => {
       window.history.pushState(null, "", window.location.href);
       setShowExitDialog(true);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examState, attemptId, doSave]);


  useEffect(() => {
    if (examState !== "bridging") {
      setBridgingSeconds(60);
      return;
    }
    const timer = setInterval(() => {
      setBridgingSeconds((prev) => {
        if (prev <= 1) { clearInterval(timer); handleNextSubtest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examState, handleNextSubtest]);


  useEffect(() => {
      if (timeLeft <= 0 && examState === "running" && !isAttemptLoading) {
           // Wait a bit before showing dialog to avoid jitter on load

           // We can check if isTimeUp?
           // Local state for dialog
           setShowTimeUpDialog(true);
      }
  }, [timeLeft, examState, isAttemptLoading]);


  const handleSubtestFinish = useCallback(() => {
      setShowConfirmFinish(false);
      // Check if we have more subtests
      if (currentSubtestIndex < ((tryout.questions as Question[])?.length || 0) - 1) {
           setExamState("bridging"); 
      } else {
           finishExam();
      }
  }, [currentSubtestIndex, tryout.questions, setExamState, finishExam]);

  const triggerFinishCheck = useCallback((force?: boolean) => {
     if (!currentSubtestId) return;
     const answeredCount = Object.keys(answers[currentSubtestId] || {}).length;

     if (force || answeredCount >= questions.length ) { 
          handleSubtestFinish();
     } else {
          setShowConfirmFinish(true);
     }
  }, [currentSubtestId, answers, questions.length, handleSubtestFinish]);


  useEffect(() => {
      if (showTimeUpDialog) {
          const timeout = setTimeout(() => {
              setShowTimeUpDialog(false);
              triggerFinishCheck(true); 
          }, 3000);
          return () => clearTimeout(timeout);
      }
  }, [showTimeUpDialog, triggerFinishCheck]);


  if (isAttemptLoading || examState === "loading" || isSubmitting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-12 h-12 text-gsb-orange" />
        </motion.div>
        {isSubmitting ? (
             <div className="text-center">
                <p className="text-lg font-semibold text-gsb-maroon animate-pulse">Menyimpan dan mengakhiri ujian...</p>
                <p className="text-sm text-muted-foreground">Sebentar ya, jawaban kamu sedang disimpan</p>
             </div>
        ) : (
             <p className="text-muted-foreground">Memuat ujian...</p>
        )}
      </div>
    );
  }


  if (examState === "finished") {
    return <ExamFinished />;
  }


  if (examState === "bridging") {
    const questionsArr = (tryout.questions as Question[]) || [];
    
    return (
      <ExamBridging
        currentSubtestIndex={currentSubtestIndex}
        questions={questionsArr}
        answers={answers}
        subtestLabels={SUBTEST_LABELS}
        bridgingSeconds={bridgingSeconds}
        onNextSubtest={handleNextSubtest}
      />
    );
  }


  if (examState === "ready") {
    const questionsArr = (tryout.questions as Question[]) || [];
    const subLabel = currentSubtest ? (SUBTEST_LABELS[currentSubtest.subtest] ?? currentSubtest.subtest) : "";
    
    return (
      <motion.div {...ANIM.fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes {currentSubtestIndex + 1} dari {questionsArr.length}</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-1">{currentSubtest?.title}</h2>
          <p className="text-gsb-blue font-medium mb-2">{subLabel}</p>
          <div className="w-20 h-1 bg-gsb-orange rounded-full mx-auto mb-8" />
          <Button size="lg" onClick={startAttempt} className="w-full md:w-auto px-12 h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg">
             Mulai Subtes Ini
          </Button>
        </Card>
      </motion.div>
    );
  }
  

  if (!currentQuestion) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const subtestLabel = currentSubtest ? (SUBTEST_LABELS[currentSubtest.subtest] ?? currentSubtest.subtest) : "";
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto py-4 md:py-12 px-4 md:px-6 min-h-screen">
      <ExamHeader currentSubtestIndex={currentSubtestIndex} subtests={tryout.questions as Question[] || []} currentSubtestTitle={currentSubtest?.title} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-[80vh] select-none" onContextMenu={(e) => e.preventDefault()}>
        <div className="lg:col-span-3 flex flex-col">
          <QuestionDisplay
            question={currentQuestion}
            index={currentQuestionIndex}
            userAnswer={answers[currentSubtestId]?.[currentQuestion.id || ""] || ""}
            isFlagged={!!flags[currentSubtestId]?.[currentQuestion.id || ""]}
            onAnswer={handleAnswer}
            onFlag={toggleFlag}
            onNext={() => setCurrentQuestionIndex(prev => prev + 1)}
            onPrev={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            isFirst={currentQuestionIndex === 0}
            isLast={currentQuestionIndex >= questions.length - 1}
            onFinishSubtest={() => triggerFinishCheck(false)}
          />
        </div>

        <ExamSidebar
            timeLeft={timeLeft}
            formatTime={formatTime}
            subtestLabel={subtestLabel}
            questions={questions}
            currentSubtestId={currentSubtestId}
            answers={answers}
            flags={flags}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
        />
      </div>

      <ExamDialogs
          showTimeUpDialog={showTimeUpDialog}
          setShowTimeUpDialog={setShowTimeUpDialog}
          showConfirmFinish={showConfirmFinish}
          setShowConfirmFinish={setShowConfirmFinish}
          showExitDialog={showExitDialog}
          setShowExitDialog={setShowExitDialog}
          unansweredCount={questions.length - Object.keys(answers[currentSubtestId] || {}).length}
          onConfirmFinish={handleSubtestFinish}
      />

      <MobileExamControls
        timeLeft={timeLeft}
        formatTime={formatTime}
        questions={questions}
        currentSubtestId={currentSubtestId}
        answers={answers}
        flags={flags}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
      />
    </div>
  );
};
