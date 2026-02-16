"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { Tryout, Question } from "@/payload-types";
import type { TryoutAttempt } from "../../types";
import { clearBackup, clearEvents } from "@/lib/tryout-storage";

import { useExamState, type ExamState, type AnswerMap, type FlagMap, type ExamStatus } from "./useExamState";
import { useExamTimer } from "./useExamTimer";
import { useNavigationProtection } from "./useNavigationProtection";
import { useExamSync } from "./useExamSync";
import { useAttemptRestoration } from "./useAttemptRestoration";
import { useExamDialogs } from "./useExamDialogs";

// --- Types & Constants ---

export type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
export type SubtestAnswer = NonNullable<SubtestQuestion["tryoutAnswers"]>[number];
export type { ExamState, AnswerMap, FlagMap, ExamStatus };

export interface TryoutExamProps {
  tryout: Tryout;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

interface TryoutWithTests extends Tryout {
  tests?: Question[] | null;
}

export const SUBTEST_LABELS: Record<string, string> = {
  PU: "Penalaran Umum", PK: "Pengetahuan Kuantitatif", PM: "Penalaran Matematika",
  LBE: "Literasi Bahasa Inggris", LBI: "Literasi Bahasa Indonesia",
  PPU: "Pengetahuan & Pemahaman Umum", KMBM: "Kemampuan Memahami Bacaan & Menulis",
};

export const ANIM = {
  fadeSlide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  },
  staggerContainer: { animate: { transition: { staggerChildren: 0.08 } } },
  staggerChild: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }
} as const;

// --- Main Hook ---

export function useTryoutExam({ tryout, onFinish }: TryoutExamProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const tryoutData = tryout as TryoutWithTests;
  const subtests = useMemo(() => (Array.isArray(tryoutData.tests) ? tryoutData.tests : []), [tryoutData.tests]);

  const { state, dispatch } = useExamState();

  const currentSubtest = useMemo(() => subtests[state.currentSubtestIndex], [subtests, state.currentSubtestIndex]);
  const currentSubtestId = currentSubtest?.id ?? "";
  const questions = useMemo(() => (currentSubtest?.tryoutQuestions || []) as SubtestQuestion[], [currentSubtest]);
  const currentQuestion = questions[state.currentQuestionIndex];
  const subtestKey = currentSubtest?.subtest ?? "";
  const subtestLabel = useMemo(() => subtestKey ? (SUBTEST_LABELS[subtestKey] || subtestKey) : "", [subtestKey]);

  const { timeLeft, setTimeLeft, formatTime } = useExamTimer({
    initialSeconds: (currentSubtest?.duration ?? 0) * 60,
    isRunning: state.status === "running",
    onTimeUp: useCallback(() => dispatch({ type: "SET_DIALOG", dialog: "timeUp", open: true }), [dispatch]),
  });

  const { queueEvent, flushEvents, clearSyncData, saveProgressBatchMutation } = useExamSync({
    attemptId: state.attemptId,
    state,
    timeLeft,
  });

  useNavigationProtection({
    isEnabled: state.status === "running",
    onPopState: useCallback(() => dispatch({ type: "SET_DIALOG", dialog: "exit", open: true }), [dispatch]),
  });

  const { data: attempt, isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId: tryout.id })
  );

  const startAttemptMutation = useMutation(trpc.tryoutAttempts.startAttempt.mutationOptions({
    onSuccess: (data) => {
      dispatch({ type: "SET_ATTEMPT", id: data.id, status: "running" });
      setTimeLeft((currentSubtest?.duration ?? 0) * 60);
      toast.success("Ujian dimulai!");
    },
    onError: (err) => toast.error("Gagal memulai: " + err.message),
  }));

  const submitAttemptMutation = useMutation(trpc.tryoutAttempts.submitAttempt.mutationOptions({
    onSuccess: () => {
      dispatch({ type: "SET_STATUS", status: "finished" });
      if (state.attemptId) clearSyncData();
      toast.success("Ujian selesai! Jawaban tersimpan.");
      onFinish(state.answers);
    },
    onError: (err) => toast.error("Gagal submit: " + err.message),
  }));

  useAttemptRestoration({
    attempt,
    isLoading: isAttemptLoading,
    subtests,
    onRestore: useCallback((restoredState) => {
      dispatch({ 
        type: "LOAD_STATE", 
        state: {
          attemptId: restoredState.attemptId,
          currentSubtestIndex: restoredState.currentSubtestIndex,
          currentQuestionIndex: restoredState.currentQuestionIndex,
          answers: restoredState.answers,
          flags: restoredState.flags,
          status: restoredState.status,
        }
      });
      if (restoredState.timeLeft !== undefined) {
        setTimeLeft(restoredState.timeLeft);
      }
    }, [dispatch, setTimeLeft]),
  });

  const handleStart = () => startAttemptMutation.mutate({ tryoutId: tryout.id });

  const handleSubtestFinish = useCallback(async () => {
    if (submitAttemptMutation.isPending) return;
    dispatch({ type: "SET_DIALOG", dialog: "confirmFinish", open: false });

    if (state.currentSubtestIndex < subtests.length - 1) {
      dispatch({ type: "SET_STATUS", status: "bridging" });
    } else {
      if (state.attemptId) {
        await flushEvents(true);
        const safeAnswers = state.answers || {};
        await submitAttemptMutation.mutateAsync({ attemptId: state.attemptId, answers: safeAnswers });
      } else {
        dispatch({ type: "SET_STATUS", status: "finished" });
        onFinish(state.answers || {});
      }
    }
  }, [state.currentSubtestIndex, subtests.length, state.attemptId, state.answers, onFinish, submitAttemptMutation, flushEvents, dispatch]);

  const handleNextSubtest = useCallback(() => {
    const nextIdx = state.currentSubtestIndex + 1;
    const nextDuration = subtests[nextIdx]?.duration ?? 0;
    
    dispatch({ type: "SET_SUBTEST", index: nextIdx });
    dispatch({ type: "SET_STATUS", status: "running" });
    setTimeLeft(nextDuration * 60);
    window.scrollTo({ top: 0, behavior: "smooth" });
    flushEvents(true);
  }, [state.currentSubtestIndex, subtests, flushEvents, dispatch, setTimeLeft]);

  // Consolidates dialog timing logic
  useExamDialogs({
    status: state.status,
    bridgingSeconds: state.bridgingSeconds,
    timeUpDialog: state.dialogs.timeUp,
    onNextSubtest: handleNextSubtest,
    onFinish: handleSubtestFinish,
    dispatch,
  });

  const triggerFinishCheck = useCallback(() => {
    const answeredCount = currentSubtestId ? Object.keys(state.answers[currentSubtestId] || {}).length : 0;
    if (answeredCount < questions.length) {
      dispatch({ type: "SET_DIALOG", dialog: "confirmFinish", open: true });
    } else {
      handleSubtestFinish();
    }
  }, [state.answers, currentSubtestId, questions.length, handleSubtestFinish, dispatch]);

  const handleNextQuestion = useCallback(() => {
    dispatch({ type: "NEXT_QUESTION" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    flushEvents(false);
  }, [flushEvents, dispatch]);

  const handlePrevQuestion = useCallback(() => {
    dispatch({ type: "PREV_QUESTION" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    flushEvents(false);
  }, [flushEvents, dispatch]);

  const setCurrentQuestionIndex = useCallback((idx: number) => {
    dispatch({ type: "SET_QUESTION", index: idx });
    flushEvents(false);
  }, [flushEvents, dispatch]);

  const handleAnswer = useCallback((qId: string, aId: string) => {
    if (!currentSubtestId) return;
    dispatch({ type: "SET_ANSWER", subtestId: currentSubtestId, questionId: qId, answerId: aId });
    queueEvent({ kind: "answer", subtestId: currentSubtestId, questionId: qId, answerId: aId });
  }, [currentSubtestId, queueEvent, dispatch]);

  const toggleFlag = useCallback((qId: string) => {
    if (!currentSubtestId) return;
    const currentFlag = state.flags[currentSubtestId]?.[qId] ?? false;
    const nextFlag = !currentFlag;

    dispatch({ type: "TOGGLE_FLAG", subtestId: currentSubtestId, questionId: qId });
    queueEvent({ kind: "flag", subtestId: currentSubtestId, questionId: qId, flag: nextFlag });
  }, [currentSubtestId, queueEvent, dispatch, state.flags]);

  return {
    subtests,
    currentSubtestIndex: state.currentSubtestIndex,
    currentSubtestId,
    currentSubtest,
    currentQuestionIndex: state.currentQuestionIndex,
    currentQuestion,
    questions,
    subtestLabel,
    answers: state.answers,
    flags: state.flags,
    timeLeft,
    examState: state.status,
    attemptId: state.attemptId,
    bridgingSeconds: state.bridgingSeconds,
    isAttemptLoading,

    showConfirmFinish: state.dialogs.confirmFinish, 
    setShowConfirmFinish: (open: boolean) => dispatch({ type: "SET_DIALOG", dialog: "confirmFinish", open }),
    showExitDialog: state.dialogs.exit, 
    setShowExitDialog: (open: boolean) => dispatch({ type: "SET_DIALOG", dialog: "exit", open }),
    showTimeUpDialog: state.dialogs.timeUp, 
    setShowTimeUpDialog: (open: boolean) => dispatch({ type: "SET_DIALOG", dialog: "timeUp", open }),

    startAttemptMutation,
    submitAttemptMutation,

    handleStart,
    handleSubtestFinish,
    handleNextSubtest,
    handleNextQuestion,
    handlePrevQuestion,
    handleAnswer,
    toggleFlag,
    triggerFinishCheck,
    setCurrentQuestionIndexWithFlush: setCurrentQuestionIndex,
    formatTime,
    router,
  };
}
