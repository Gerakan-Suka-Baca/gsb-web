"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useTryoutExam, ANIM, SUBTEST_LABELS } from "../hooks/useTryoutExam";
import { QuestionDisplay } from "./exam/QuestionDisplay";
import { ExamHeader } from "./exam/ExamHeader";
import { ExamSidebar } from "./exam/ExamSidebar";
import { ExamDialogs } from "./exam/ExamDialogs";
import { ExamFinished } from "./exam/ExamFinished";
import { MobileExamControls } from "./exam/MobileExamControls";

import type { Tryout } from "@/payload-types";
import type { AnswerMap } from "../hooks/useTryoutExam";

interface TryoutExamProps {
  tryout: Tryout;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

export const TryoutExam = ({ tryout, onFinish }: TryoutExamProps) => {
  const exam = useTryoutExam({ tryout, onFinish });

  // --- Loading ---
  if (exam.isAttemptLoading || exam.examState === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-10 h-10 text-gsb-orange" />
        </motion.div>
      </div>
    );
  }

  // --- Submitting ---
  if (exam.submitAttemptMutation.isPending) {
    return (
      <ExamFinished
        title="Menyimpan Jawaban..."
        description="Mohon tunggu, sistem sedang mengirim dan menyimpan jawaban."
        showButton={false}
        isLoading
      />
    );
  }

  // --- Finished ---
  if (exam.examState === "finished") {
    return (
      <ExamFinished
        title="Ujian Selesai!"
        description="Jawaban Anda telah tersimpan dan dinilai."
      />
    );
  }

  // --- Bridging ---
  if (exam.examState === "bridging") {
    const completedSubtest = exam.subtests[exam.currentSubtestIndex];
    const nextSubtest = exam.subtests[exam.currentSubtestIndex + 1];
    const completedLabel = completedSubtest?.subtest ? (SUBTEST_LABELS[completedSubtest.subtest] || completedSubtest.subtest) : "";
    const nextLabel = nextSubtest?.subtest ? (SUBTEST_LABELS[nextSubtest.subtest] || nextSubtest.subtest) : "";

    return (
      <motion.div {...ANIM.fadeSlide} className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8">
        <motion.div variants={ANIM.staggerContainer} initial="initial" animate="animate" className="max-w-2xl w-full space-y-8">
          <motion.div variants={ANIM.staggerChild}>
            <Card className="p-8 bg-green-50 border-green-200 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Subtes {exam.currentSubtestIndex + 1} Selesai!</h3>
                  <p className="text-green-700 text-sm">{completedSubtest?.title} — {completedLabel}</p>
                </div>
              </div>
              <div className="text-sm text-green-700 bg-green-100 rounded-lg p-3">
                Kamu menjawab <span className="font-bold">{completedSubtest?.id ? Object.keys(exam.answers[completedSubtest.id] || {}).length : 0}</span> dari <span className="font-bold">{completedSubtest?.tryoutQuestions?.length || 0}</span> soal.
              </div>
            </Card>
          </motion.div>
          {nextSubtest && (
            <motion.div variants={ANIM.staggerChild}>
              <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes Selanjutnya</p>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-gsb-maroon">{nextSubtest.title}</h2>
                  <p className="text-gsb-blue font-medium mt-1">{nextLabel}</p>
                  <div className="w-16 h-1 bg-gsb-orange rounded-full mx-auto mt-3" />
                </div>
                <div className="flex justify-center mb-6">
                  <div className="text-sm font-semibold text-orange-600 bg-orange-100 px-4 py-1.5 rounded-full animate-pulse">Otomatis lanjut dalam {exam.bridgingSeconds} detik</div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1 text-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Durasi</span>
                    <span className="text-xl font-bold text-gsb-blue">{nextSubtest.duration} Menit</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1 text-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Soal</span>
                    <span className="text-xl font-bold text-gsb-blue">{nextSubtest.tryoutQuestions?.length || 0} Butir</span>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" onClick={exam.handleNextSubtest} className="w-full h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg">
                    Mulai Subtes Berikutnya →
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // --- Ready / Start Screen ---
  if (exam.examState === "ready") {
    return (
      <motion.div {...ANIM.fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes {exam.currentSubtestIndex + 1} dari {exam.subtests.length}</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-1">{exam.currentSubtest?.title}</h2>
          <p className="text-gsb-blue font-medium mb-2">{exam.subtestLabel}</p>
          <div className="w-20 h-1 bg-gsb-orange rounded-full mx-auto mb-8" />
          <motion.div variants={ANIM.staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4 mb-8">
            <motion.div variants={ANIM.staggerChild} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Durasi</span>
              <span className="text-2xl font-bold text-gsb-blue">{exam.currentSubtest?.duration ?? 0} Menit</span>
            </motion.div>
            <motion.div variants={ANIM.staggerChild} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Jumlah Soal</span>
              <span className="text-2xl font-bold text-gsb-blue">{exam.questions.length} Butir</span>
            </motion.div>
          </motion.div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-8 flex gap-3 text-left">
            <span className="shrink-0 mt-0.5">⚠️</span><p>Waktu akan berjalan segera setelah Anda menekan tombol mulai.</p>
          </div>
          <Button size="lg" onClick={exam.handleStart} className="w-full md:w-auto px-12 h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg" disabled={exam.startAttemptMutation.isPending}>
            {exam.startAttemptMutation.isPending && <Loader2 className="mr-2 animate-spin" />} Mulai Subtes Ini
          </Button>
        </Card>
      </motion.div>
    );
  }

  // --- Running: Main Exam View ---
  if (!exam.currentQuestion || !exam.currentSubtestId) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const unansweredCount = exam.questions.length - (exam.currentSubtestId ? Object.keys(exam.answers[exam.currentSubtestId] || {}).length : 0);

  return (
    <div className="container mx-auto pt-4 pb-6 md:pt-8 md:pb-10 px-4 md:px-6 min-h-screen">
      <MobileExamControls
        timeLeft={exam.timeLeft}
        formatTime={exam.formatTime}
        questions={exam.questions}
        currentSubtestId={exam.currentSubtestId}
        answers={exam.answers}
        flags={exam.flags}
        currentQuestionIndex={exam.currentQuestionIndex}
        setCurrentQuestionIndex={exam.setCurrentQuestionIndexWithFlush}
      />

      <ExamHeader
        currentSubtestIndex={exam.currentSubtestIndex}
        subtests={exam.subtests}
        currentSubtestTitle={exam.currentSubtest?.title}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[80vh] select-none" onContextMenu={(e) => e.preventDefault()}>
        <div className="lg:col-span-3 flex flex-col">
          <QuestionDisplay
            key={exam.currentSubtestId}
            question={exam.currentQuestion}
            index={exam.currentQuestionIndex}
            userAnswer={exam.answers[exam.currentSubtestId]?.[exam.currentQuestion.id || `q-${exam.currentQuestionIndex}`]}
            isFlagged={exam.flags[exam.currentSubtestId]?.[exam.currentQuestion.id || `q-${exam.currentQuestionIndex}`]}
            onAnswer={exam.handleAnswer}
            onFlag={exam.toggleFlag}
            onNext={exam.handleNextQuestion}
            onPrev={exam.handlePrevQuestion}
            isFirst={exam.currentQuestionIndex === 0}
            isLast={exam.currentQuestionIndex >= exam.questions.length - 1}
            onFinishSubtest={exam.triggerFinishCheck}
          />
        </div>

        <ExamSidebar
          timeLeft={exam.timeLeft}
          formatTime={exam.formatTime}
          subtestLabel={exam.subtestLabel}
          questions={exam.questions}
          currentSubtestId={exam.currentSubtestId}
          answers={exam.answers}
          flags={exam.flags}
          currentQuestionIndex={exam.currentQuestionIndex}
          setCurrentQuestionIndex={exam.setCurrentQuestionIndexWithFlush}
        />
      </div>

      <ExamDialogs
        showTimeUpDialog={exam.showTimeUpDialog}
        setShowTimeUpDialog={exam.setShowTimeUpDialog}
        showConfirmFinish={exam.showConfirmFinish}
        setShowConfirmFinish={exam.setShowConfirmFinish}
        showExitDialog={exam.showExitDialog}
        setShowExitDialog={exam.setShowExitDialog}
        unansweredCount={unansweredCount}
        onConfirmFinish={exam.handleSubtestFinish}
      />
    </div>
  );
};
