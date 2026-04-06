"use client";

import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { usePostHog } from 'posthog-js/react';
import { toast } from "sonner";
import type { Tryout, Question } from "@/payload-types";
import type { TryoutAttempt } from "../../types";

import { useExamState, type ExamState, type AnswerMap, type FlagMap, type ExamStatus } from "./useExamState";
import { useExamTimer } from "./useExamTimer";
import { useNavigationProtection } from "./useNavigationProtection";
import { useExamSync, type ServerTimingSyncPayload } from "./useExamSync";
import { useAttemptRestoration } from "./useAttemptRestoration";
import { useExamDialogs } from "./useExamDialogs";

export type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
export type SubtestAnswer = NonNullable<SubtestQuestion["tryoutAnswers"]>[number];
export type { ExamState, AnswerMap, FlagMap, ExamStatus };

export interface TryoutExamProps {
  tryout: Tryout;
  initialAttempt?: TryoutAttempt | null;
  onFinish: (answers: Record<string, AnswerMap>) => void;
}

type StartAttemptInput = { tryoutId: string };
type SubmitAttemptInput = {
  attemptId: string;
  answers: Record<string, AnswerMap>;
  submitMode?: "manual" | "timeout";
};

interface TryoutWithTests extends Tryout {
  tests?: Question[] | null;
}

type ActiveTiming = {
  subtestStartedAt?: string;
  subtestDeadlineAt?: string;
  secondsRemaining?: number;
};

const getActiveTimingFromRecord = (record: Record<string, unknown>): ActiveTiming => {
  const aliasStartedAt =
    typeof record.activeSubtestStartedAt === "string" ? record.activeSubtestStartedAt : undefined;
  const aliasDeadlineAt =
    typeof record.activeSubtestDeadlineAt === "string" ? record.activeSubtestDeadlineAt : undefined;
  const aliasSeconds =
    typeof record.activeSecondsRemaining === "number" ? record.activeSecondsRemaining : undefined;
  if (aliasStartedAt || aliasDeadlineAt || typeof aliasSeconds === "number") {
    return {
      subtestStartedAt: aliasStartedAt,
      subtestDeadlineAt: aliasDeadlineAt,
      secondsRemaining: aliasSeconds,
    };
  }
  const isRetakeRunning = record.retakeStatus === "running";
  const subtestStartedAt = isRetakeRunning
    ? typeof record.retakeSubtestStartedAt === "string"
      ? record.retakeSubtestStartedAt
      : undefined
    : typeof record.subtestStartedAt === "string"
      ? record.subtestStartedAt
      : undefined;
  const subtestDeadlineAt = isRetakeRunning
    ? typeof record.retakeSubtestDeadlineAt === "string"
      ? record.retakeSubtestDeadlineAt
      : undefined
    : typeof record.subtestDeadlineAt === "string"
      ? record.subtestDeadlineAt
      : undefined;
  const secondsRemaining = isRetakeRunning
    ? typeof record.retakeSecondsRemaining === "number"
      ? record.retakeSecondsRemaining
      : undefined
    : typeof record.secondsRemaining === "number"
      ? record.secondsRemaining
      : undefined;
  return { subtestStartedAt, subtestDeadlineAt, secondsRemaining };
};

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

export function useTryoutExam({ tryout, initialAttempt, onFinish }: TryoutExamProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const tryoutData = tryout as TryoutWithTests;
  const subtests = useMemo(() => (Array.isArray(tryoutData.tests) ? tryoutData.tests : []), [tryoutData.tests]);

  const initialRecord = initialAttempt as unknown as Record<string, unknown> | undefined;
  const initialTiming: ActiveTiming = initialRecord
    ? getActiveTimingFromRecord(initialRecord)
    : {};
  const { state, dispatch } = useExamState();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const [subtestStartedAt, setSubtestStartedAt] = useState<string | null>(
    typeof initialTiming.subtestStartedAt === "string"
      ? initialTiming.subtestStartedAt
      : null
  );
  const [subtestDeadlineAt, setSubtestDeadlineAt] = useState<string | null>(
    typeof initialTiming.subtestDeadlineAt === "string"
      ? initialTiming.subtestDeadlineAt
      : null
  );
  const [serverNow, setServerNow] = useState<string | null>(null);
  const [isFinishingSubtest, setIsFinishingSubtest] = useState(false);

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
  
  const { data: subtestContent, isLoading: isContentLoading, isError: isContentError, refetch: refetchSubtest } = useQuery(
    trpc.tryouts.getSubtest.queryOptions(
      { subtestId: currentSubtestId },
      { enabled: !!currentSubtestId, staleTime: Infinity }
    )
  );

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

  const prefetchAllSubtests = useCallback(() => {
    for (const subtest of subtests) {
      if (!subtest?.id) continue;
      queryClient.prefetchQuery(
        trpc.tryouts.getSubtest.queryOptions({ subtestId: subtest.id }, { staleTime: Infinity })
      );
    }
  }, [subtests, queryClient, trpc]);

  useEffect(() => {
    if (subtests.length === 0) return;
    prefetchNext();
    prefetchAllSubtests();
  }, [subtests.length, prefetchNext, prefetchAllSubtests]);

  const questions = useMemo(() => {
    const fetchedSubtest = subtestContent as Question | null | undefined;
    if (fetchedSubtest && fetchedSubtest.id === currentSubtestId) {
        return (fetchedSubtest.tryoutQuestions || []) as SubtestQuestion[];
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

  const statusRef = useRef(state.status);
  useEffect(() => { statusRef.current = state.status; }, [state.status]);

  const { timeLeft, setTimeLeft, formatTime, hasValidDeadline } = useExamTimer({
    initialSeconds: subtestDuration,
    isRunning: state.status === "running" && subtestDuration > 0,
    deadlineAt: subtestDeadlineAt,
    serverNow,
    onTimeUp: useCallback(() => {
      if (statusRef.current !== "running") return;
      dispatch({ type: "SET_DIALOG", dialog: "timeUp", open: true });
    }, [dispatch]),
  });

  const applyServerTiming = useCallback((payload?: ServerTimingSyncPayload | null) => {
    if (!payload) return;
    if (typeof payload.subtestStartedAt === "string") {
      setSubtestStartedAt(payload.subtestStartedAt);
    }
    if (typeof payload.subtestDeadlineAt === "string") {
      setSubtestDeadlineAt(payload.subtestDeadlineAt);
    }
    if (typeof payload.serverNow === "string") {
      setServerNow(payload.serverNow);
    }
    if (typeof payload.secondsRemaining === "number" && payload.secondsRemaining >= 0) {
      setTimeLeft(payload.secondsRemaining);
    }
  }, [setTimeLeft]);

  const applyServerTimingFromRecord = useCallback(
    (record: Record<string, unknown>) => {
      const activeTiming = getActiveTimingFromRecord(record);
      applyServerTiming({
        subtestStartedAt: activeTiming.subtestStartedAt,
        subtestDeadlineAt: activeTiming.subtestDeadlineAt,
        serverNow: typeof record.serverNow === "string" ? record.serverNow : undefined,
        secondsRemaining: activeTiming.secondsRemaining,
      });
    },
    [applyServerTiming]
  );

  const { queueEvent, flushEvents, clearSyncData } = useExamSync({
    attemptId: state.attemptId,
    state,
    timeLeft,
    onServerTiming: applyServerTiming,
    tryoutId: tryout.id,
  });

  useNavigationProtection({
    isEnabled: state.status === "running",
    onPopState: useCallback(() => {
      if (currentSubtestId) {
        posthog.capture("subtest_abandoned", {
          tryout_id: tryout.id,
          attempt_id: state.attemptId,
          subtest_id: currentSubtestId,
        });
      }
      dispatch({ type: "SET_DIALOG", dialog: "exit", open: true });
    }, [dispatch, posthog, tryout.id, state.attemptId, currentSubtestId]),
  });

  const isAttemptLoading = false;


  const startAttemptMutation = useMutation<TryoutAttempt, TRPCClientErrorLike<AppRouter>, StartAttemptInput>(
    trpc.tryoutAttempts.startAttempt.mutationOptions({
    onSuccess: async (data: TryoutAttempt) => {
      dispatch({ type: "SET_ATTEMPT", id: data.id, status: "running" });
      const record = data as unknown as Record<string, unknown>;
      if (record.retakeStatus === "running") {
        const retakeAnswers =
          (record.retakeAnswers as Record<string, AnswerMap> | undefined) || {};
        const retakeFlags =
          (record.retakeFlags as Record<string, FlagMap> | undefined) || {};
        const retakeSubtest =
          typeof record.retakeCurrentSubtest === "number"
            ? record.retakeCurrentSubtest
            : 0;
        const retakeQuestion =
          typeof record.retakeCurrentQuestionIndex === "number"
            ? record.retakeCurrentQuestionIndex
            : 0;
        dispatch({
          type: "LOAD_STATE",
          state: {
            answers: retakeAnswers,
            flags: retakeFlags,
            currentSubtestIndex: retakeSubtest,
            currentQuestionIndex: retakeQuestion,
            status: "running",
          },
        });
      }
      applyServerTimingFromRecord(record);
      const activeTiming = getActiveTimingFromRecord(record);
      const secondsRemaining = activeTiming.secondsRemaining;
      if (typeof secondsRemaining === "number" && secondsRemaining > 0) {
        setTimeLeft(secondsRemaining);
      }
      toast.success("Ujian dimulai!");
      
      posthog.capture("tryout_started", { tryout_id: tryout.id, attempt_id: data.id });
      posthog.capture("subtest_started", { 
        tryout_id: tryout.id, 
        attempt_id: data.id, 
        subtest_id: currentSubtest?.id,
        subtest_duration_minutes: currentSubtest?.duration 
      });

      void queryClient.invalidateQueries({
        queryKey: [["tryoutAttempts", "getAttempt"], { input: { tryoutId: tryout.id }, type: "query" }],
      });
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error("Gagal memulai: " + err.message);
      setSubtestStartedAt(null);
      setSubtestDeadlineAt(null);
    },
  }));

  const submitAttemptMutation = useMutation<TryoutAttempt, TRPCClientErrorLike<AppRouter>, SubmitAttemptInput>(
    trpc.tryoutAttempts.submitAttempt.mutationOptions({
    onSuccess: () => {
      dispatch({ type: "SET_STATUS", status: "finished" });
      if (state.attemptId) clearSyncData();
      toast.success("Ujian selesai! Jawaban tersimpan.");
      onFinish(state.answers);
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      posthog.capture("tryout_submit_failed", {
        tryout_id: tryout.id,
        attempt_id: state.attemptId,
        message: err.message,
      });
      toast.error("Gagal submit: " + err.message);
    },
  }));

  useAttemptRestoration({
    attempt: initialAttempt,
    isLoading: false,
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
      if (restoredState.subtestStartedAt !== undefined) {
        setSubtestStartedAt(restoredState.subtestStartedAt ?? null);
      }
      if (restoredState.subtestDeadlineAt !== undefined) {
        setSubtestDeadlineAt(restoredState.subtestDeadlineAt ?? null);
      }
      setServerNow(null);
      if (restoredState.timeLeft !== undefined) {
        setTimeLeft(restoredState.timeLeft);
      }
    }, [dispatch, setTimeLeft]),
  });

  const handleStart = useCallback(async () => {
    if (startAttemptMutation.isPending) return;
    dispatch({ type: "SET_STATUS", status: "loading" });
    const timeoutMs = 15000;
    try {
      await Promise.race([
        startAttemptMutation.mutateAsync({ tryoutId: tryout.id }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
        ),
      ]);
    } catch (error) {
      dispatch({ type: "SET_STATUS", status: "ready" });
      if (error instanceof Error && error.message === "Request timeout") {
        toast.error("Memulai subtes terlalu lama. Coba klik lagi.");
      }
    }
  }, [dispatch, startAttemptMutation, tryout.id]);

  const handleSubtestFinish = useCallback(async (submitMode: "manual" | "timeout" = "manual") => {
    if (submitAttemptMutation.isPending || isFinishingSubtest) return;
    const normalizedSubmitMode: "manual" | "timeout" =
      submitMode === "timeout" ? "timeout" : "manual";
    setIsFinishingSubtest(true);
    dispatch({ type: "SET_DIALOG", dialog: "confirmFinish", open: false });

    const initialSeconds = currentSubtest?.duration ? currentSubtest.duration * 60 : 0;
    const elapsedSeconds = Math.max(0, initialSeconds - timeLeft);
    if (currentSubtestId) {
      dispatch({ type: "SET_SUBTEST_DURATION", subtestId: currentSubtestId, elapsedSeconds });
      posthog.capture("subtest_completed", {
        tryout_id: tryout.id,
        attempt_id: state.attemptId,
        subtest_id: currentSubtestId,
        time_spent_seconds: elapsedSeconds
      });
    }

    if (state.currentSubtestIndex < subtests.length - 1) {
      const timing = await flushEvents(true, { status: "bridging" });
      if (!timing) {
        toast.error("Gagal menyimpan progres. Coba lagi sebelum lanjut.");
        setIsFinishingSubtest(false);
        return;
      }
      dispatch({ type: "SET_STATUS", status: "bridging" });
      setIsFinishingSubtest(false);
    } else {
      if (state.attemptId) {
        try {
          void flushEvents(false);
          const rawAnswers = state.answers || {};
          const safeAnswers: Record<string, Record<string, string>> = {};
          for (const [subtestId, answerMap] of Object.entries(rawAnswers)) {
            if (typeof answerMap !== "object" || answerMap === null) continue;
            const cleanMap: Record<string, string> = {};
            for (const [qId, val] of Object.entries(answerMap)) {
              if (typeof val === "string") cleanMap[qId] = val;
            }
            safeAnswers[subtestId] = cleanMap;
          }

          const safeDurations = { ...state.subtestDurations };
          if (currentSubtestId) safeDurations[currentSubtestId] = elapsedSeconds;
          
          await submitAttemptMutation.mutateAsync({ 
            attemptId: state.attemptId, 
            answers: safeAnswers,
            submitMode: normalizedSubmitMode,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          toast.error("Terjadi kesalahan saat finalisasi ujian: " + msg);
          setIsFinishingSubtest(false);
        }
      } else {
        dispatch({ type: "SET_STATUS", status: "finished" });
        onFinish(state.answers || {});
        setIsFinishingSubtest(false);
      }
    }
  }, [state.currentSubtestIndex, subtests.length, state.attemptId, state.answers, state.subtestDurations, onFinish, submitAttemptMutation, flushEvents, dispatch, currentSubtest?.duration, currentSubtestId, timeLeft, posthog, tryout.id, isFinishingSubtest]);

  const handleTimeUpConfirm = useCallback(async () => {
    if (state.status !== "running") {
      dispatch({ type: "SET_DIALOG", dialog: "timeUp", open: false });
      return;
    }
    if (!hasValidDeadline) {
      posthog.capture("timeup_blocked_invalid_deadline", {
        tryout_id: tryout.id,
        attempt_id: state.attemptId,
      });
      toast.error("Timer belum tervalidasi. Sinkronisasi dulu.");
      return;
    }
    const timing = await flushEvents(true);
    if (!timing || typeof timing.secondsRemaining !== "number") {
      posthog.capture("timeup_sync_failed", {
        tryout_id: tryout.id,
        attempt_id: state.attemptId,
      });
      toast.error("Gagal sinkronisasi timer. Coba lagi.");
      return;
    }
    if (timing.secondsRemaining > 0) {
      posthog.capture("timeup_blocked_not_expired", {
        tryout_id: tryout.id,
        attempt_id: state.attemptId,
        seconds_remaining: timing.secondsRemaining,
      });
      toast.error("Timer belum habis. Sinkronisasi ulang.");
      return;
    }
    posthog.capture("timeup_confirmed", {
      tryout_id: tryout.id,
      attempt_id: state.attemptId,
    });
    await handleSubtestFinish("timeout");
  }, [state.status, flushEvents, handleSubtestFinish, hasValidDeadline, posthog, tryout.id, state.attemptId, dispatch]);

  const handleNextSubtest = useCallback(async () => {
    const nextIdx = state.currentSubtestIndex + 1;
    const nextDuration = subtests[nextIdx]?.duration ?? 0;
    const fallbackSeconds = Math.max(0, Math.round(nextDuration * 60));
    dispatch({ type: "SET_DIALOG", dialog: "timeUp", open: false });
    dispatch({ type: "SET_DIALOG", dialog: "confirmFinish", open: false });
    dispatch({ type: "SET_DIALOG", dialog: "exit", open: false });
    dispatch({ type: "SET_STATUS", status: "loading" });
    setSubtestStartedAt(null);
    setSubtestDeadlineAt(null);
    setServerNow(null);
    setTimeLeft(0);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const timing = await flushEvents(true, {
      currentSubtestIndex: nextIdx,
      currentQuestionIndex: 0,
      status: "running",
    });

    if (!timing) {
      toast.error("Gagal sinkronisasi subtes. Coba lagi.");
      dispatch({ type: "SET_STATUS", status: "bridging" });
      return;
    }

    const serverSubtest =
      typeof timing.currentSubtest === "number" ? timing.currentSubtest : nextIdx;
    if (serverSubtest !== nextIdx) {
      posthog.capture("subtest_override_by_server", {
        tryout_id: tryout.id,
        attempt_id: state.attemptId,
        client_subtest_index: nextIdx,
        server_subtest_index: serverSubtest,
      });
    }
    dispatch({ type: "SET_SUBTEST", index: serverSubtest });
    posthog.capture("subtest_started", {
      tryout_id: tryout.id,
      attempt_id: state.attemptId,
      subtest_id: subtests[serverSubtest]?.id,
      subtest_duration_minutes: subtests[serverSubtest]?.duration ?? 0,
    });
    dispatch({ type: "SET_STATUS", status: "running" });
    if (timing?.secondsRemaining && timing.secondsRemaining > 0) {
      setTimeLeft(timing.secondsRemaining);
    } else if (fallbackSeconds > 0) {
      setTimeLeft(fallbackSeconds);
    }
  }, [state.currentSubtestIndex, subtests, flushEvents, dispatch, setTimeLeft, posthog, tryout.id, state.attemptId]);

  useExamDialogs({
    status: state.status,
    bridgingSeconds: state.bridgingSeconds,
    dispatch,
    onBridgingComplete: handleNextSubtest,
  });

  const triggerFinishCheck = useCallback(() => {
    if (isFinishingSubtest) return;
    const answeredCount = currentSubtestId ? Object.keys(state.answers[currentSubtestId] || {}).length : 0;
    if (answeredCount < questions.length) {
      dispatch({ type: "SET_DIALOG", dialog: "confirmFinish", open: true });
    } else {
      handleSubtestFinish("manual");
    }
  }, [state.answers, currentSubtestId, questions.length, handleSubtestFinish, dispatch, isFinishingSubtest]);

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
    if (typeof qId !== "string" || typeof aId !== "string") return;
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
    subtestStartedAt,
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
    isFinishingSubtest,

    startAttemptMutation,
    submitAttemptMutation,

    handleStart,
    handleSubtestFinish,
    handleTimeUpConfirm,
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
