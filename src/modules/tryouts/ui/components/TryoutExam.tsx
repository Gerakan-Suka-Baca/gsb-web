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
  LayoutGrid,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";

interface TryoutExamProps {
  tryout: Tryout;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

const SUBTEST_LABELS: Record<string, string> = {
  PU: "Penalaran Umum",
  PK: "Pengetahuan Kuantitatif",
  PM: "Penalaran Matematika",
  LBE: "Literasi Bahasa Inggris",
  LBI: "Literasi Bahasa Indonesia",
  PPU: "Pengetahuan & Pemahaman Umum",
  KMBM: "Kemampuan Memahami Bacaan & Menulis",
};

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
} as const;

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08  } },
} as const;

const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
} as const;

export const TryoutExam = ({ tryout, onFinish }: TryoutExamProps) => {
  const router = useRouter();
  const trpc = useTRPC();

  const subtests = (tryout.questions as Question[]) || [];

  const [currentSubtestIndex, setCurrentSubtestIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerMap>>({});
  const [flags, setFlags] = useState<Record<string, FlagMap>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examState, setExamState] = useState<"loading" | "ready" | "running" | "bridging" | "finished">("loading");
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const debouncedAnswers = useDebounce(answers, 1000);
  const debouncedFlags = useDebounce(flags, 1000);

  const currentSubtest = subtests[currentSubtestIndex];
  const questions = currentSubtest?.tryoutQuestions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const subtestLabel = currentSubtest ? (SUBTEST_LABELS[currentSubtest.subtest] || currentSubtest.subtest) : "";

  // --- TRPC ---

  const { data: attempt, isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId: tryout.id })
  );

  const startAttemptMutation = useMutation(
    trpc.tryoutAttempts.startAttempt.mutationOptions({
      onSuccess: (data) => {
        setAttemptId(data.id);
        setExamState("running");
        const duration = currentSubtest?.duration ?? tryout.duration ?? 0;
        setTimeLeft(duration * 60);
        toast.success("Ujian dimulai!");
      },
      onError: (err) => toast.error("Gagal memulai: " + err.message),
    })
  );

  const saveProgressMutation = useMutation(
    trpc.tryoutAttempts.saveProgress.mutationOptions({
      onError: (err) => console.error("Auto-save failed:", err),
    })
  );

  const submitAttemptMutation = useMutation(
    trpc.tryoutAttempts.submitAttempt.mutationOptions({
      onSuccess: () => {
        setExamState("finished");
        onFinish(answers);
        toast.success("Ujian selesai! Jawaban tersimpan.");
        router.push("/tryout");
      },
      onError: (err) => toast.error("Gagal submit: " + err.message),
    })
  );

  // --- Effects ---

  useEffect(() => {
    if (isAttemptLoading) return;
    if (attempt) {
      setAttemptId(attempt.id);
      setAnswers((attempt.answers as Record<string, AnswerMap>) || {});
      setFlags((attempt.flags as Record<string, FlagMap>) || {});
      if (attempt.status === "completed") { setExamState("finished"); return; }
      if (attempt.status === "started") {
        setExamState("running");
        if (attempt.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
          const total = (tryout.duration ?? 0) * 60;
          setTimeLeft(Math.max(total - elapsed, 0));
        } else {
          setTimeLeft((currentSubtest?.duration ?? tryout.duration ?? 0) * 60);
        }
      }
    } else {
      setExamState("ready");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, isAttemptLoading]);

  useEffect(() => {
    if ((Object.keys(debouncedAnswers).length > 0 || Object.keys(debouncedFlags).length > 0) && attemptId) {
      saveProgressMutation.mutate({ attemptId, answers: debouncedAnswers, flags: debouncedFlags });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAnswers, debouncedFlags, attemptId]);

  const handleStart = () => startAttemptMutation.mutate({ tryoutId: tryout.id });

  const handleSubtestFinish = useCallback(() => {
    setShowConfirmFinish(false);
    if (currentSubtestIndex < subtests.length - 1) {
      setExamState("bridging");
    } else {
      if (attemptId) {
        submitAttemptMutation.mutate({ attemptId, answers });
      } else {
        setExamState("finished");
        onFinish(answers);
      }
    }
  }, [currentSubtestIndex, subtests.length, attemptId, answers, onFinish, submitAttemptMutation]);

  const handleNextSubtest = () => {
    setCurrentSubtestIndex((prev) => prev + 1);
    setCurrentQuestionIndex(0);
    const nextDuration = subtests[currentSubtestIndex + 1]?.duration ?? 0;
    setTimeLeft(nextDuration * 60);
    setExamState("running");
  };

  const triggerFinishCheck = () => {
    const answeredCount = Object.keys(answers[currentSubtest.id] || {}).length;
    if (answeredCount < questions.length) {
      setShowConfirmFinish(true);
    } else {
      handleSubtestFinish();
    }
  };

  useEffect(() => {
    if (examState !== "running" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleSubtestFinish(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examState, handleSubtestFinish, timeLeft]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentSubtest.id]: { ...(prev[currentSubtest.id] || {}), [questionId]: answerId },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlags((prev) => ({
      ...prev,
      [currentSubtest.id]: { ...(prev[currentSubtest.id] || {}), [questionId]: !prev[currentSubtest.id]?.[questionId] },
    }));
  };

  const renderNavigator = () => (
    <div className="flex flex-wrap gap-2 justify-center content-start">
      {questions.map((_, idx) => {
        const qID = questions[idx].id || `q-${idx}`;
        const isAns = answers[currentSubtest.id]?.[qID];
        const isFlg = flags[currentSubtest.id]?.[qID];
        const isCurr = currentQuestionIndex === idx;

        let variant = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
        if (isCurr) variant = "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100";
        else if (isFlg) variant = "bg-yellow-400 text-yellow-900 border-yellow-400";
        else if (isAns) variant = "bg-green-600 text-white border-green-600";

        return (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentQuestionIndex(idx)}
            className={cn("w-9 h-9 text-xs rounded-md flex items-center justify-center font-bold border transition-colors", variant)}
          >
            {idx + 1}
          </motion.button>
        );
      })}
    </div>
  );

  // --- Render States ---

  if (isAttemptLoading || examState === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-10 h-10 text-gsb-orange" />
        </motion.div>
      </div>
    );
  }

  if (examState === "finished") {
    return (
      <motion.div {...fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-md w-full p-8 border-none shadow-xl bg-green-50">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
          </motion.div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Ujian Selesai!</h2>
          <p className="text-green-700 mb-6">Jawaban Anda telah tersimpan dan dinilai.</p>
          <Button onClick={() => router.push("/tryout")} className="w-full bg-green-600 hover:bg-green-700 text-white">
            Kembali ke Dashboard
          </Button>
        </Card>
      </motion.div>
    );
  }

  // Bridging page between subtests
  if (examState === "bridging") {
    const completedSubtest = subtests[currentSubtestIndex];
    const nextSubtest = subtests[currentSubtestIndex + 1];
    const answeredInCurrent = Object.keys(answers[completedSubtest?.id] || {}).length;
    const totalInCurrent = completedSubtest?.tryoutQuestions?.length || 0;

    return (
      <motion.div {...fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-2xl w-full space-y-6">
          {/* Completed summary */}
          <motion.div variants={staggerChild}>
            <Card className="p-6 bg-green-50 border-green-200 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Subtes {currentSubtestIndex + 1} Selesai!</h3>
                  <p className="text-green-700 text-sm">{completedSubtest?.title} — {SUBTEST_LABELS[completedSubtest?.subtest] || completedSubtest?.subtest}</p>
                </div>
              </div>
              <div className="text-sm text-green-700 bg-green-100 rounded-lg p-3">
                Kamu menjawab <span className="font-bold">{answeredInCurrent}</span> dari <span className="font-bold">{totalInCurrent}</span> soal.
              </div>
            </Card>
          </motion.div>

          {/* Next subtest info */}
          {nextSubtest && (
            <motion.div variants={staggerChild}>
              <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes Selanjutnya</p>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-gsb-maroon">
                    {nextSubtest.title}
                  </h2>
                  <p className="text-gsb-blue font-medium mt-1">{SUBTEST_LABELS[nextSubtest.subtest] || nextSubtest.subtest}</p>
                  <div className="w-16 h-1 bg-gsb-orange rounded-full mx-auto mt-3"></div>
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

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 mb-6 flex gap-3 text-left">
                  <span className="shrink-0">⚠️</span>
                  <p>Waktu subtes berikutnya dimulai saat kamu menekan tombol di bawah.</p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={handleNextSubtest}
                    className="w-full h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg"
                  >
                    Mulai Subtes Berikutnya
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          )}

          {/* Progress dots */}
          <motion.div variants={staggerChild} className="flex justify-center gap-2">
            {subtests.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  idx < currentSubtestIndex + 1 ? "bg-green-500" : idx === currentSubtestIndex + 1 ? "bg-gsb-orange animate-pulse" : "bg-gray-300"
                )}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (examState === "ready") {
    return (
      <motion.div {...fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes {currentSubtestIndex + 1} dari {subtests.length}</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-1">
            {currentSubtest?.title}
          </h2>
          <p className="text-gsb-blue font-medium mb-2">{subtestLabel}</p>
          <div className="w-20 h-1 bg-gsb-orange rounded-full mx-auto mb-8"></div>

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4 mb-8">
            <motion.div variants={staggerChild} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Durasi</span>
              <span className="text-2xl font-bold text-gsb-blue">{currentSubtest?.duration ?? 0} Menit</span>
            </motion.div>
            <motion.div variants={staggerChild} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Jumlah Soal</span>
              <span className="text-2xl font-bold text-gsb-blue">{questions.length} Butir</span>
            </motion.div>
          </motion.div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-8 flex gap-3 text-left">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <p>Waktu akan berjalan segera setelah Anda menekan tombol mulai. Tidak ada jeda selama pengerjaan subtes.</p>
          </div>

          {/* Subtest progress */}
          <div className="flex justify-center gap-2 mb-6">
            {subtests.map((_, idx) => (
              <div key={idx} className={cn("w-3 h-3 rounded-full", idx === currentSubtestIndex ? "bg-gsb-orange" : idx < currentSubtestIndex ? "bg-green-500" : "bg-gray-300")} />
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full md:w-auto px-12 h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg"
              disabled={startAttemptMutation.isPending}
            >
              {startAttemptMutation.isPending ? <Loader2 className="mr-2 animate-spin" /> : null}
              Mulai Subtes Ini
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  if (!currentQuestion) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const currentQID = currentQuestion.id || `q-${currentQuestionIndex}`;
  const currentAns = answers[currentSubtest.id]?.[currentQID];
  const isFlagged = flags[currentSubtest.id]?.[currentQID];
  const answeredCount = Object.keys(answers[currentSubtest.id] || {}).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <>
      {/* Subtest Indicator Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-lg bg-gradient-to-r from-gsb-maroon to-gsb-red px-4 py-2.5 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-bold">
            Subtes {currentSubtestIndex + 1}/{subtests.length}
          </span>
          <span className="font-semibold text-sm hidden sm:inline">{currentSubtest?.title}</span>
          <span className="text-white/70 text-xs hidden md:inline">— {subtestLabel}</span>
        </div>
        <div className="flex gap-1">
          {subtests.map((_, idx) => (
            <div key={idx} className={cn("w-2 h-2 rounded-full", idx === currentSubtestIndex ? "bg-white" : idx < currentSubtestIndex ? "bg-green-400" : "bg-white/30")} />
          ))}
        </div>
      </motion.div>

      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[80vh] select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      >
        {/* Soal & Opsi */}
        <div className="lg:col-span-3 flex flex-col">

          {/* Mobile: Timer + Nav */}
          <div className="flex lg:hidden justify-between items-center bg-card p-4 rounded-lg border shadow-sm sticky top-20 z-10 mb-6">
            <div className="font-semibold text-sm line-clamp-1 flex-1 mr-2">{subtestLabel}</div>
            <div className="flex items-center gap-3">
              <div className={cn("font-mono text-lg font-bold flex gap-1.5 items-center", timeLeft < 60 && "text-red-500 animate-pulse")}>
                <Timer className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader className="mb-4"><SheetTitle>Navigasi Soal</SheetTitle></SheetHeader>
                  <div className="overflow-y-auto max-h-[60vh] p-1">{renderNavigator()}</div>
                  <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded"></div> Sekarang</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-600 rounded"></div> Dijawab</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded"></div> Ragu</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-gray-200 rounded"></div> Kosong</div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div key={currentQID} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <Card className="p-6 md:p-8 flex flex-col gap-6 border-t-4 border-t-gsb-orange shadow-lg">
                <div className="flex justify-between items-start border-b border-border/50 pb-4">
                  <div className="text-xl font-heading font-bold text-gsb-maroon">
                    Soal No. {currentQuestionIndex + 1}
                  </div>
                  <Button
                    variant={isFlagged ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleFlag(currentQID)}
                    className={cn("gap-2 select-none", isFlagged && "bg-yellow-100 text-yellow-900 hover:bg-yellow-200")}
                  >
                    <Flag className={cn("w-4 h-4", isFlagged && "fill-current")} />
                    {isFlagged ? "Ditandai" : "Tandai Ragu"}
                  </Button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-border/50">
                  <RichText content={currentQuestion.question} className="prose-sm md:prose-base" />
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {currentQuestion.tryoutAnswers?.map((opt, idx) => {
                    const optID = opt.id || `opt-${idx}`;
                    const isSelected = currentAns === optID;
                    const char = String.fromCharCode(65 + idx);

                    return (
                      <motion.div
                        key={optID}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswer(currentQID, optID)}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none",
                          isSelected
                            ? "border-gsb-orange bg-orange-50/50 shadow-md"
                            : "border-border hover:border-gsb-orange/30 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold border transition-colors",
                          isSelected ? "bg-gsb-orange text-white border-gsb-orange" : "bg-white text-muted-foreground border-gray-300"
                        )}>
                          {char}
                        </div>
                        <div className="pt-0.5 text-base w-full">
                          <RichText content={opt.answer} className="prose-sm" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-10 pb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="h-11 px-6 rounded-full border-2 select-none"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Sebelumnya
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="bg-gsb-orange hover:bg-gsb-orange/90 text-white h-11 px-8 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 select-none"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={triggerFinishCheck}
                className="h-11 px-8 rounded-full shadow-md bg-gsb-red hover:bg-gsb-red/90 transition-transform hover:scale-105 select-none"
              >
                Selesai Subtes Ini
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT: Timer + Navigator (Desktop) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="hidden lg:flex flex-col p-4 bg-slate-900 text-white sticky top-24 shadow-xl border-slate-800 select-none">
            <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Sisa Waktu</span>
            <div className={cn("text-4xl font-mono font-bold", timeLeft < 60 && "text-red-400 animate-pulse")}>
              {formatTime(timeLeft)}
            </div>
            <div className="mt-2 text-sm text-slate-300 border-t border-slate-700 pt-2">
              {subtestLabel}
            </div>
          </Card>

          <Card className="p-5 hidden lg:block border shadow-sm sticky top-60 select-none">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <LayoutGrid className="w-4 h-4 text-gsb-blue" />
              <h3 className="font-semibold text-gsb-blue">Navigasi Soal</h3>
            </div>
            {renderNavigator()}
            <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded"></div> Sedang Dikerjakan</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-600 rounded"></div> Sudah Dijawab</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded"></div> Ragu-ragu</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-gray-200 rounded"></div> Belum Dijawab</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Soal Belum Lengkap
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              Kamu masih memiliki <span className="font-bold text-amber-600">{unansweredCount}</span> soal yang belum dijawab.
              <br /><br />
              Yakin ingin melanjutkan? Kamu tidak bisa kembali ke subtes ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa Lagi</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubtestFinish} className="bg-gsb-orange hover:bg-gsb-orange/90">
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
