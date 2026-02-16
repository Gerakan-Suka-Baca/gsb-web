"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import type { Tryout, Question } from "@/payload-types";
import type { TryoutAttempt } from "../../types";

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
  initialAttempt?: TryoutAttempt | null;
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

export function useTryoutExam({ tryout, initialAttempt, onFinish }: TryoutExamProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const tryoutData = tryout as TryoutWithTests;
  const subtests = useMemo(() => (Array.isArray(tryoutData.tests) ? tryoutData.tests : []), [tryoutData.tests]);

  const { state, dispatch } = useExamState();
  const queryClient = useQueryClient();

  // DEBUG: Trace Subtest ID
  const safeSubtestIndex = useMemo(() => {
    if (!Number.isFinite(state.currentSubtestIndex)) return 0;
    if (state.currentSubtestIndex < 0) return 0;
    if (subtests.length > 0 && state.currentSubtestIndex >= subtests.length) return 0;
    return state.currentSubtestIndex;
  }, [state.currentSubtestIndex, subtests.length]);

  useEffect(() => {
    if (subtests.length === 0) return;
    if (safeSubtestIndex !== state.currentSubtestIndex) {
      dispatch({ type: "SET_SUBTEST", index: safeSubtestIndex });
    }
  }, [safeSubtestIndex, state.currentSubtestIndex, subtests.length, dispatch]);

  const currentSubtest = useMemo(() => subtests[safeSubtestIndex], [subtests, safeSubtestIndex]);
  const currentSubtestId = typeof currentSubtest?.id === "string" ? currentSubtest.id : "";
  
  // --- Lazy Load Content ---
  const { data: subtestContent, isLoading: isContentLoading, isError: isContentError, refetch: refetchSubtest } = useQuery(
    trpc.tryouts.getSubtest.queryOptions(
      { subtestId: currentSubtestId },
      { enabled: !!currentSubtestId, staleTime: Infinity }
    )
  );

  // Prefetch next 2 subtests
  const prefetchNext = useCallback(() => {
    const nextIdx = state.currentSubtestIndex + 1;
    for (let i = nextIdx; i < nextIdx + 2; i++) {
        const nextSub = subtests[i];
        if (nextSub?.id) {
            queryClient.prefetchQuery(
                trpc.tryouts.getSubtest.queryOptions({ subtestId: nextSub.id }, { staleTime: Infinity })
            );
        }
    }
  }, [state.currentSubtestIndex, subtests, queryClient, trpc]);

  // Trigger prefetch when subtest changes
  useMemo(() => {
     if (subtests.length > 0) prefetchNext();
  }, [prefetchNext, subtests.length]);

  const questions = useMemo(() => {
    // DEBUG: Trace Question Loading
    console.log("[useTryoutExam] Resolving questions:", { 
        currentSubtestId, 
        contentId: subtestContent?.id, 
        hasContent: !!subtestContent,
        contentQLen: subtestContent?.tryoutQuestions?.length,
        fallbackQLen: currentSubtest?.tryoutQuestions?.length
    });

    if (subtestContent && subtestContent.id === currentSubtestId) {
        return (subtestContent.tryoutQuestions || []) as SubtestQuestion[];
    }
    return (currentSubtest?.tryoutQuestions || []) as SubtestQuestion[];
  }, [subtestContent, currentSubtest, currentSubtestId]);

  const getSubtestQuestionCount = useCallback((subtestId: string, fallback = 0) => {
    if (!subtestId) return fallback;
    const { queryKey } = trpc.tryouts.getSubtest.queryOptions({ subtestId });
    const cached = queryClient.getQueryData(queryKey) as Question | undefined;
    const cachedCount = cached?.tryoutQuestions?.length;
    return typeof cachedCount === "number" ? cachedCount : fallback;
  }, [trpc, queryClient]);

  const currentQuestion = questions[state.currentQuestionIndex];
  const subtestKey = currentSubtest?.subtest ?? "";
  const subtestLabel = useMemo(() => subtestKey ? (SUBTEST_LABELS[subtestKey] || subtestKey) : "", [subtestKey]);

  const subtestDuration = currentSubtest?.duration ? currentSubtest.duration * 60 : 0;

  const { timeLeft, setTimeLeft, formatTime } = useExamTimer({
    initialSeconds: subtestDuration,
    isRunning: state.status === "running" && subtestDuration > 0,
    onTimeUp: useCallback(() => dispatch({ type: "SET_DIALOG", dialog: "timeUp", open: true }), [dispatch]),
  });

  const { queueEvent, flushEvents, clearSyncData } = useExamSync({
    attemptId: state.attemptId,
    state,
    timeLeft,
  });

  useNavigationProtection({
    isEnabled: state.status === "running",
    onPopState: useCallback(() => dispatch({ type: "SET_DIALOG", dialog: "exit", open: true }), [dispatch]),
  });

  const { isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId: tryout.id })
  );


  const startAttemptMutation = useMutation(trpc.tryoutAttempts.startAttempt.mutationOptions({
    onSuccess: async (data) => {
      dispatch({ type: "SET_ATTEMPT", id: data.id, status: "running" });
      setTimeLeft((currentSubtest?.duration ?? 0) * 60);
      toast.success("Ujian dimulai!");
      await queryClient.invalidateQueries({
        queryKey: [["tryoutAttempts", "getAttempt"], { input: { tryoutId: tryout.id }, type: "query" }],
      });
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
    attempt: initialAttempt,
    isLoading: false, // Data is passed from parent, so it's already loaded
    subtests,
    currentAttemptId: state.attemptId,
    onRestore: useCallback((restoredState) => {
      const nextState: Partial<ExamState> = {};
      if (restoredState.attemptId !== undefined) nextState.attemptId = restoredState.attemptId;
      if (restoredState.currentSubtestIndex !== undefined) nextState.currentSubtestIndex = restoredState.currentSubtestIndex;
      if (restoredState.currentQuestionIndex !== undefined) nextState.currentQuestionIndex = restoredState.currentQuestionIndex;
      if (restoredState.answers !== undefined) nextState.answers = restoredState.answers;
      if (restoredState.flags !== undefined) nextState.flags = restoredState.flags;
      if (restoredState.status !== undefined) nextState.status = restoredState.status;
      dispatch({
        type: "LOAD_STATE",
        state: nextState,
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
    isContentLoading,
    isContentError,
    refetchSubtest,
    getSubtestQuestionCount,

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
