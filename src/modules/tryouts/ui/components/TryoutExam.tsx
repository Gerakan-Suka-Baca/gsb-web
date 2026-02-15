"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag, Timer, LayoutGrid, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RichText } from "@/components/ui/RichText";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useTRPC } from "@/trpc/client";
import type { Question, Tryout, TryoutAttempt } from "@/payload-types";

// --- Types & Constants ---

type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;
type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
type SubtestAnswer = NonNullable<SubtestQuestion["tryoutAnswers"]>[number];

type AttemptData = Omit<TryoutAttempt, "answers" | "flags"> & {
  answers?: Record<string, AnswerMap> | null;
  flags?: Record<string, FlagMap> | null;
  currentSubtest?: number | null;
  examState?: "running" | "bridging" | null;
  secondsRemaining?: number | null;
  currentQuestionIndex?: number | null;
};

interface TryoutExamProps {
  tryout: Tryout;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

const SUBTEST_LABELS: Record<string, string> = {
  PU: "Penalaran Umum", PK: "Pengetahuan Kuantitatif", PM: "Penalaran Matematika",
  LBE: "Literasi Bahasa Inggris", LBI: "Literasi Bahasa Indonesia",
  PPU: "Pengetahuan & Pemahaman Umum", KMBM: "Kemampuan Memahami Bacaan & Menulis",
};

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

// --- Sub-Components ---

interface QuestionDisplayProps {
  question: SubtestQuestion;
  index: number;
  userAnswer?: string;
  isFlagged: boolean;
  onAnswer: (qId: string, aId: string) => void;
  onFlag: (qId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  onFinishSubtest: () => void;
}

const QuestionDisplay = memo(({ question, index, userAnswer, isFlagged, onAnswer, onFlag, onNext, onPrev, isFirst, isLast, onFinishSubtest }: QuestionDisplayProps) => {
  const qID = question.id || `q-${index}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={qID}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-col gap-6"
      >
        <Card className="p-6 md:p-8 flex flex-col gap-6 border-t-4 border-t-gsb-orange shadow-lg">
          <div className="flex justify-between items-start border-b border-border/50 pb-4">
            <div className="text-xl font-heading font-bold text-gsb-maroon">Soal No. {index + 1}</div>
            <Button
              variant={isFlagged ? "secondary" : "outline"}
              size="sm"
              onClick={() => onFlag(qID)}
              className={cn("gap-2 select-none", isFlagged && "bg-yellow-100 text-yellow-900 hover:bg-yellow-200")}
            >
              <Flag className={cn("w-4 h-4", isFlagged && "fill-current")} />
              {isFlagged ? "Ditandai" : "Tandai Ragu"}
            </Button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-border/50 min-h-[100px]">
            <RichText content={question.question} className="prose-sm md:prose-base leading-relaxed" />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {question.tryoutAnswers?.map((opt: SubtestAnswer, idx: number) => {
              const optID = opt.id || `opt-${idx}`;
              const isSelected = userAnswer === optID;
              const char = String.fromCharCode(65 + idx);
              return (
                <motion.div
                  key={optID}
                  whileHover={{ scale: 1.005, backgroundColor: "rgba(255, 247, 237, 0.5)" }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => onAnswer(qID, optID)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-200 select-none",
                    isSelected ? "border-gsb-orange bg-orange-50/80 shadow-sm" : "border-border hover:border-gsb-orange/30"
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

        <div className="flex justify-between mt-4 pb-8">
          <Button variant="outline" onClick={onPrev} disabled={isFirst} className="h-11 px-6 rounded-full border-2 select-none">
            <ChevronLeft className="w-4 h-4 mr-2" /> Sebelumnya
          </Button>
          {!isLast ? (
            <Button onClick={onNext} className="bg-gsb-orange hover:bg-gsb-orange/90 text-white h-11 px-8 rounded-full shadow-md transition-transform hover:scale-105 select-none">
              Selanjutnya <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button variant="destructive" onClick={onFinishSubtest} className="h-11 px-8 rounded-full shadow-md bg-gsb-red hover:bg-gsb-red/90 transition-transform hover:scale-105 select-none">
              Selesai Subtes Ini
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
QuestionDisplay.displayName = "QuestionDisplay";

interface NavigatorProps {
  questions: SubtestQuestion[];
  currentSubtestId: string;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentIndex: number;
  onSelect: (index: number) => void;
}

const Navigator = memo(({ questions, currentSubtestId, answers, flags, currentIndex, onSelect }: NavigatorProps) => (
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

// --- Main Component ---

export const TryoutExam = ({ tryout, onFinish }: TryoutExamProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const subtests = useMemo(() => {
    const q = tryout.questions as Question[];
    return q || [];
  }, [tryout.questions]);

  // State
  const [currentSubtestIndex, setCurrentSubtestIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerMap>>({});
  const [flags, setFlags] = useState<Record<string, FlagMap>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examState, setExamState] = useState<"loading" | "ready" | "running" | "bridging" | "finished">("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [bridgingSeconds, setBridgingSeconds] = useState(60);
  
  // Dialog States
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);

  // Derived
  const debouncedAnswers = useDebounce(answers, 3000);
  const debouncedFlags = useDebounce(flags, 3000);
  const currentSubtest = subtests[currentSubtestIndex];
  const questions = (currentSubtest?.tryoutQuestions || []) as SubtestQuestion[];
  const currentQuestion = questions[currentQuestionIndex];
  const subtestLabel = currentSubtest ? (SUBTEST_LABELS[currentSubtest.subtest] ?? currentSubtest.subtest) : "";

  // TRPC Hooks
  const { data: attempt, isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId: tryout.id })
  );

  const startAttemptMutation = useMutation(trpc.tryoutAttempts.startAttempt.mutationOptions({
    onSuccess: (data) => {
      setAttemptId(data.id);
      setExamState("running");
      setTimeLeft((currentSubtest?.duration ?? tryout.duration ?? 0) * 60);
      toast.success("Ujian dimulai!");
    },
    onError: (err) => toast.error("Gagal memulai: " + err.message),
  }));

  const saveProgressMutation = useMutation(trpc.tryoutAttempts.saveProgress.mutationOptions({
    onError: (err) => console.error("Auto-save failed:", err),
  }));

  const submitAttemptMutation = useMutation(trpc.tryoutAttempts.submitAttempt.mutationOptions({
    onSuccess: () => {
      setExamState("finished");
      if (attemptId) localStorage.removeItem(`gsb-tryout-backup-${attemptId}`);
      toast.success("Ujian selesai! Jawaban tersimpan.");
      onFinish(answers);
    },
    onError: (err) => toast.error("Gagal submit: " + err.message),
  }));

  // Effects
  useEffect(() => {
    if (isAttemptLoading) return;
    if (!attempt) {
      setExamState("ready");
      return;
    }
    const data = attempt as AttemptData;
    if (data.currentSubtest !== undefined && data.currentSubtest !== null) setCurrentSubtestIndex(data.currentSubtest);
    if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex !== null) setCurrentQuestionIndex(data.currentQuestionIndex);
    if (data.examState) setExamState(data.examState);

    setAttemptId(data.id);
    
    // Load from DB first
    let initialAnswers = data.answers || {};
    let initialFlags = data.flags || {};

    // Check local storage for unsaved progress
    if (typeof window !== 'undefined') {
        const backupKey = `gsb-tryout-backup-${data.id}`;
        const raw = localStorage.getItem(backupKey);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // Prioritize local storage data as it might have unsaved changes
                if (parsed.answers) {
                    Object.keys(parsed.answers).forEach(subtestId => {
                        initialAnswers[subtestId] = { ...(initialAnswers[subtestId] || {}), ...parsed.answers[subtestId] };
                    });
                }
                if (parsed.flags) {
                    Object.keys(parsed.flags).forEach(subtestId => {
                        initialFlags[subtestId] = { ...(initialFlags[subtestId] || {}), ...parsed.flags[subtestId] };
                    });
                }
                console.log("Restored unsaved progress");
            } catch (e) {
                console.error("Failed to parse local backup", e);
            }
        }
    }

    setAnswers(initialAnswers);
    setFlags(initialFlags);

    if (data.status === "completed") {
      setExamState("finished");
    } else if (data.status === "started") {
      const savedSeconds = data.secondsRemaining ?? undefined;
      const defaultDuration = (currentSubtest?.duration ?? tryout.duration ?? 0) * 60;
      setTimeLeft(savedSeconds ?? defaultDuration);
      if (!data.examState) setExamState("running");
    }
  }, [attempt, isAttemptLoading, currentSubtest?.duration, tryout.duration]);

  // Backup to local storage on change
  useEffect(() => {
    if (!attemptId) return;
    const backupKey = `gsb-tryout-backup-${attemptId}`;
    localStorage.setItem(backupKey, JSON.stringify({
        answers,
        flags,
        updatedAt: Date.now()
    }));
  }, [answers, flags, attemptId]);


  useEffect(() => {
    const hasProgress = Object.keys(debouncedAnswers).length > 0 || Object.keys(debouncedFlags).length > 0;
    if (hasProgress && attemptId) {
      const persistedExamState = examState === "running" || examState === "bridging" ? examState : undefined;
      saveProgressMutation.mutate({
        attemptId, answers: debouncedAnswers, flags: debouncedFlags,
        currentSubtest: currentSubtestIndex, examState: persistedExamState, secondsRemaining: timeLeft,
        currentQuestionIndex: currentQuestionIndex,
      });
    }
  }, [debouncedAnswers, debouncedFlags, attemptId, currentSubtestIndex, examState, saveProgressMutation, timeLeft, currentQuestionIndex]);

  useEffect(() => {
    if (examState !== "running") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimeUpDialog(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examState]);

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

  useEffect(() => {
    if (showTimeUpDialog) {
      const timeout = setTimeout(() => {
        setShowTimeUpDialog(false);
        handleSubtestFinish();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showTimeUpDialog, handleSubtestFinish]);

  useEffect(() => {
    if (examState !== "running") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitDialog(true);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [examState]);

  const handleStart = () => startAttemptMutation.mutate({ tryoutId: tryout.id });

  const handleNextSubtest = useCallback(() => {
    const nextIdx = currentSubtestIndex + 1;
    setCurrentSubtestIndex(nextIdx);
    setCurrentQuestionIndex(0);
    const nextDuration = subtests[nextIdx]?.duration ?? 0;
    setTimeLeft(nextDuration * 60);
    setExamState("running");

    if (attemptId) {
      saveProgressMutation.mutate({
        attemptId, answers, flags, currentSubtest: nextIdx,
        examState: "running", secondsRemaining: nextDuration * 60
      });
    }
  }, [currentSubtestIndex, subtests, attemptId, answers, flags, saveProgressMutation]);

  const triggerFinishCheck = useCallback(() => {
    const answeredCount = Object.keys(answers[currentSubtest.id] || {}).length;
    if (answeredCount < questions.length) {
      setShowConfirmFinish(true);
    } else {
      handleSubtestFinish();
    }
  }, [answers, currentSubtest?.id, questions.length, handleSubtestFinish]);

  const handleNextQuestion = useCallback(() => setCurrentQuestionIndex(prev => prev + 1), []);
  const handlePrevQuestion = useCallback(() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1)), []);
  
  const handleAnswer = useCallback((qId: string, aId: string) => {
    setAnswers(prev => ({ ...prev, [currentSubtest.id]: { ...(prev[currentSubtest.id] || {}), [qId]: aId } }));
  }, [currentSubtest?.id]);

  const toggleFlag = useCallback((qId: string) => {
    setFlags(prev => ({ ...prev, [currentSubtest.id]: { ...(prev[currentSubtest.id] || {}), [qId]: !prev[currentSubtest.id]?.[qId] } }));
  }, [currentSubtest?.id]);

  const handleMobileNavigate = useCallback((idx: number) => {
    setCurrentQuestionIndex(idx);
    setIsNavigatorOpen(false);
  }, []);

  // Bridging Timer
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

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  // --- Render Views ---

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
      <motion.div {...ANIM.fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-md w-full p-8 border-none shadow-xl bg-green-50">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
          </motion.div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Ujian Selesai!</h2>
          <p className="text-green-700 mb-6">Jawaban Anda telah tersimpan dan dinilai.</p>
          <Button onClick={() => router.push("/tryout")} className="w-full bg-green-600 hover:bg-green-700 text-white">Kembali ke Dashboard</Button>
        </Card>
      </motion.div>
    );
  }

  if (examState === "bridging") {
    const completedSubtest = subtests[currentSubtestIndex];
    const nextSubtest = subtests[currentSubtestIndex + 1];
    return (
      <motion.div {...ANIM.fadeSlide} className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8">
        <motion.div variants={ANIM.staggerContainer} initial="initial" animate="animate" className="max-w-2xl w-full space-y-8">
          <motion.div variants={ANIM.staggerChild}>
            <Card className="p-8 bg-green-50 border-green-200 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}><CheckCircle2 className="w-8 h-8 text-green-600" /></motion.div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Subtes {currentSubtestIndex + 1} Selesai!</h3>
                  <p className="text-green-700 text-sm">{completedSubtest?.title} — {SUBTEST_LABELS[completedSubtest?.subtest] || completedSubtest?.subtest}</p>
                </div>
              </div>
              <div className="text-sm text-green-700 bg-green-100 rounded-lg p-3">
                Kamu menjawab <span className="font-bold">{Object.keys(answers[completedSubtest?.id] || {}).length}</span> dari <span className="font-bold">{completedSubtest?.tryoutQuestions?.length || 0}</span> soal.
              </div>
            </Card>
          </motion.div>
          {nextSubtest && (
            <motion.div variants={ANIM.staggerChild}>
              <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes Selanjutnya</p>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-gsb-maroon">{nextSubtest.title}</h2>
                  <p className="text-gsb-blue font-medium mt-1">{SUBTEST_LABELS[nextSubtest.subtest] || nextSubtest.subtest}</p>
                  <div className="w-16 h-1 bg-gsb-orange rounded-full mx-auto mt-3" />
                </div>
                <div className="flex justify-center mb-6">
                  <div className="text-sm font-semibold text-orange-600 bg-orange-100 px-4 py-1.5 rounded-full animate-pulse">Otomatis lanjut dalam {bridgingSeconds} detik</div>
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
                  <Button size="lg" onClick={handleNextSubtest} className="w-full h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg">
                    Mulai Subtes Berikutnya <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  if (examState === "ready") {
    return (
      <motion.div {...ANIM.fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Card className="max-w-2xl w-full p-8 md:p-12 border-none shadow-xl bg-gradient-to-br from-white to-orange-50/50">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subtes {currentSubtestIndex + 1} dari {subtests.length}</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-1">{currentSubtest?.title}</h2>
          <p className="text-gsb-blue font-medium mb-2">{subtestLabel}</p>
          <div className="w-20 h-1 bg-gsb-orange rounded-full mx-auto mb-8" />
          <motion.div variants={ANIM.staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4 mb-8">
            <motion.div variants={ANIM.staggerChild} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Durasi</span>
              <span className="text-2xl font-bold text-gsb-blue">{currentSubtest?.duration ?? 0} Menit</span>
            </motion.div>
            <motion.div variants={ANIM.staggerChild} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Jumlah Soal</span>
              <span className="text-2xl font-bold text-gsb-blue">{questions.length} Butir</span>
            </motion.div>
          </motion.div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-8 flex gap-3 text-left">
            <span className="shrink-0 mt-0.5">⚠️</span><p>Waktu akan berjalan segera setelah Anda menekan tombol mulai.</p>
          </div>
          <Button size="lg" onClick={handleStart} className="w-full md:w-auto px-12 h-12 text-lg font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-full shadow-lg" disabled={startAttemptMutation.isPending}>
            {startAttemptMutation.isPending && <Loader2 className="mr-2 animate-spin" />} Mulai Subtes Ini
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (!currentQuestion) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-xl bg-gradient-to-r from-gsb-maroon to-gsb-red px-6 py-4 flex items-center justify-between text-white shadow-xl">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-bold shrink-0">Subtes {currentSubtestIndex + 1}/{subtests.length}</span>
          <span className="font-semibold text-sm line-clamp-1">{currentSubtest?.title}</span>
        </div>
        <div className="flex gap-1">
          {subtests.map((_, idx) => (
            <div key={idx} className={cn("w-2 h-2 rounded-full", idx === currentSubtestIndex ? "bg-white" : idx < currentSubtestIndex ? "bg-green-400" : "bg-white/30")} />
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[80vh] select-none" onContextMenu={(e) => e.preventDefault()}>
        <div className="lg:col-span-3 flex flex-col">
          <div className="flex lg:hidden justify-between items-center bg-card p-4 rounded-lg border shadow-sm sticky top-20 z-10 mb-6">
            <div className="font-semibold text-sm line-clamp-1 flex-1 mr-2">{subtestLabel}</div>
            <div className="flex items-center gap-3">
              <div className={cn("font-mono text-lg font-bold flex gap-1.5 items-center", timeLeft < 60 && "text-red-500 animate-pulse")}>
                <Timer className="w-4 h-4" />{formatTime(timeLeft)}
              </div>
              <Sheet open={isNavigatorOpen} onOpenChange={setIsNavigatorOpen}>
                <SheetTrigger asChild><Button variant="outline" size="sm" className="h-9 w-9 p-0"><LayoutGrid className="w-4 h-4" /></Button></SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl">
                  <SheetHeader className="mb-4"><SheetTitle>Navigasi Soal</SheetTitle></SheetHeader>
                  <div className="overflow-y-auto max-h-[70vh] p-1 pb-8">
                    <Navigator questions={questions} currentSubtestId={currentSubtest.id} answers={answers} flags={flags} currentIndex={currentQuestionIndex} onSelect={handleMobileNavigate} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <QuestionDisplay
            key={currentSubtest.id}
            question={currentQuestion}
            index={currentQuestionIndex}
            userAnswer={answers[currentSubtest.id]?.[currentQuestion.id || `q-${currentQuestionIndex}`]}
            isFlagged={flags[currentSubtest.id]?.[currentQuestion.id || `q-${currentQuestionIndex}`]}
            onAnswer={handleAnswer}
            onFlag={toggleFlag}
            onNext={handleNextQuestion}
            onPrev={handlePrevQuestion}
            isFirst={currentQuestionIndex === 0}
            isLast={currentQuestionIndex >= questions.length - 1}
            onFinishSubtest={triggerFinishCheck}
          />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="hidden lg:flex flex-col p-6 bg-slate-900 text-white sticky top-20 shadow-2xl border-slate-800 select-none rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Sisa Waktu</span>
            <div className={cn("text-4xl font-mono font-bold", timeLeft < 60 && "text-red-400 animate-pulse")}>{formatTime(timeLeft)}</div>

            <div className="mt-2 text-sm text-slate-300 border-t border-slate-700 pt-2">{subtestLabel}</div>
          </Card>

          <Card className="p-5 hidden lg:block border shadow-sm sticky top-64 select-none rounded-xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b"><LayoutGrid className="w-4 h-4 text-gsb-blue" /><h3 className="font-semibold text-gsb-blue">Navigasi Soal</h3></div>
            <Navigator questions={questions} currentSubtestId={currentSubtest.id} answers={answers} flags={flags} currentIndex={currentQuestionIndex} onSelect={setCurrentQuestionIndex} />
            <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded" /> Sedang Dikerjakan</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-600 rounded" /> Sudah Dijawab</div>
            </div>
          </Card>
        </div>
      </div>

      <AlertDialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><Timer className="h-5 w-5" />Waktu Habis!</AlertDialogTitle>
            <AlertDialogDescription>Subtes ini telah berakhir. Anda akan dialihkan.</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-5 w-5" />Soal Belum Lengkap</AlertDialogTitle>
            <AlertDialogDescription>Kamu masih memiliki <span className="font-bold text-amber-600">{questions.length - Object.keys(answers[currentSubtest.id] || {}).length}</span> soal yang belum dijawab. Yakin?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa Lagi</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubtestFinish} className="bg-gsb-orange hover:bg-gsb-orange/90">Ya, Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Keluar dari Ujian?</AlertDialogTitle>
            <AlertDialogDescription>
              Waktu masih berjalan! Progres Anda tersimpan otomatis, namun meninggalkan halaman ini dapat mengganggu sesi ujian.<br /><br />
              <span className="font-semibold text-red-600">Tekan &quot;Lanjutkan Ujian&quot; untuk kembali mengerjakan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/tryout')} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">Keluar (Batalkan)</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowExitDialog(false)} className="bg-gsb-orange hover:bg-gsb-orange/90">Lanjutkan Ujian</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
