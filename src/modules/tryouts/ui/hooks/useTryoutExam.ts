"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import type { Tryout, Question, TryoutAttempt } from "@/payload-types";
import {
  appendEvent,
  clearBackup,
  clearEvents,
  getPendingEvents,
  loadBackup,
  markEventsFailed,
  markEventsSent,
  saveBackup,
  type TryoutEvent,
} from "@/lib/tryout-storage";

// --- Types & Constants ---

export type AnswerMap = Record<string, string>;
export type FlagMap = Record<string, boolean>;
export type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];
export type SubtestAnswer = NonNullable<SubtestQuestion["tryoutAnswers"]>[number];
export type ExamState = "loading" | "ready" | "running" | "bridging" | "finished";

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

// --- Hook ---

export function useTryoutExam({ tryout, onFinish }: TryoutExamProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const tryoutData = tryout as TryoutWithTests;
  const subtests = useMemo(() => (Array.isArray(tryoutData.tests) ? tryoutData.tests : []), [tryoutData.tests]);

  // State
  const [currentSubtestIndex, setCurrentSubtestIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerMap>>({});
  const [flags, setFlags] = useState<Record<string, FlagMap>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examState, setExamState] = useState<ExamState>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [bridgingSeconds, setBridgingSeconds] = useState(60);
  
  // Dialog States
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

  // Refs — keep latest values accessible synchronously inside async callbacks
  const timeLeftRef = useRef(timeLeft);
  const currentSubtestIndexRef = useRef(currentSubtestIndex);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const examStateRef = useRef(examState);
  const answersRef = useRef(answers);
  const flagsRef = useRef(flags);
  const revisionRef = useRef<Record<string, number>>({});
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRetryAtRef = useRef(0);
  const flushEventsRef = useRef<(force?: boolean) => void>(() => {});

  // Sequential write queue — every server write chains onto this promise
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Derived
  const [changeToken, setChangeToken] = useState(0);
  const debouncedChangeToken = useDebounce(changeToken, 4000);
  const currentSubtest = subtests[currentSubtestIndex];
  const currentSubtestId = currentSubtest?.id ?? "";
  const questions = (currentSubtest?.tryoutQuestions || []) as SubtestQuestion[];
  const currentQuestion = questions[currentQuestionIndex];
  const subtestKey = currentSubtest?.subtest ?? "";
  const subtestLabel = subtestKey ? (SUBTEST_LABELS[subtestKey] || subtestKey) : "";

  // TRPC Hooks
  const { data: attempt, isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId: tryout.id })
  );

  const startAttemptMutation = useMutation(trpc.tryoutAttempts.startAttempt.mutationOptions({
    onSuccess: (data) => {
      setAttemptId(data.id);
      setExamState("running");
      setTimeLeft((currentSubtest?.duration ?? 0) * 60);
      toast.success("Ujian dimulai!");
    },
    onError: (err) => toast.error("Gagal memulai: " + err.message),
  }));

  const saveProgressBatchMutation = useMutation(trpc.tryoutAttempts.saveProgressBatch.mutationOptions({
    retry: false,
    onError: () => {},
  }));

  const submitAttemptMutation = useMutation(trpc.tryoutAttempts.submitAttempt.mutationOptions({
    onSuccess: () => {
      setExamState("finished");
      if (attemptId) {
        clearBackup(attemptId);
        clearEvents(attemptId);
      }
      toast.success("Ujian selesai! Jawaban tersimpan.");
      onFinish(answers);
    },
    onError: (err) => toast.error("Gagal submit: " + err.message),
  }));

  const createId = useCallback(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  // --- Write Queue & Flush ---

  const scheduleRetry = useCallback((failCount: number) => {
    const delays = [5000, 15000, 45000, 120000, 300000];
    const delay = delays[Math.min(failCount, delays.length - 1)];
    const nextAt = Date.now() + delay;
    if (nextAt <= lastRetryAtRef.current) return;
    lastRetryAtRef.current = nextAt;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      flushEventsRef.current(true);
    }, delay);
  }, []);

  const flushEvents = useCallback(async (force?: boolean) => {
    if (!attemptId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      scheduleRetry(0);
      return;
    }

    // The actual work — executed inside the sequential queue
    const doFlush = async () => {
      let pending: TryoutEvent[] = [];
      try {
        pending = await getPendingEvents(attemptId, 20);
        if (pending.length === 0) return;

        const persistedExamState =
          examStateRef.current === "running" || examStateRef.current === "bridging"
            ? examStateRef.current
            : undefined;

        await saveProgressBatchMutation.mutateAsync({
          attemptId,
          batchId: createId(),
          clientTime: Date.now(),
          events: pending,
          currentSubtest: currentSubtestIndexRef.current,
          examState: persistedExamState,
          secondsRemaining: timeLeftRef.current,
          currentQuestionIndex: currentQuestionIndexRef.current,
        });
        await markEventsSent(attemptId, pending.map((e) => e.id));

        // Drain remaining events recursively
        const more = await getPendingEvents(attemptId, 1);
        if (more.length > 0) await doFlush();
      } catch {
        await markEventsFailed(attemptId, pending.map((e) => e.id));
        const maxFail = pending.reduce((acc, e) => Math.max(acc, (e.failedCount ?? 0) + 1), 0);
        scheduleRetry(maxFail);
      }
    };

    if (force) {
      // Wait for preceding writes, then flush
      const queued = writeQueueRef.current.then(doFlush).catch(() => {});
      writeQueueRef.current = queued;
      await queued;
    } else {
      // Fire-and-forget but still sequential
      writeQueueRef.current = writeQueueRef.current.then(doFlush).catch(() => {});
    }
  }, [attemptId, createId, saveProgressBatchMutation, scheduleRetry]);

  // --- Ref Sync ---
  useEffect(() => { flushEventsRef.current = flushEvents; }, [flushEvents]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { currentSubtestIndexRef.current = currentSubtestIndex; }, [currentSubtestIndex]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { examStateRef.current = examState; }, [examState]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);

  // --- Local Backup ---
  useEffect(() => {
    if (!attemptId) return;
    const handler = setTimeout(() => {
      saveBackup(attemptId, {
        answers: answersRef.current,
        flags: flagsRef.current,
        currentSubtest: currentSubtestIndexRef.current,
        currentQuestionIndex: currentQuestionIndexRef.current,
        examState: examStateRef.current,
        secondsRemaining: timeLeftRef.current,
      });
    }, 1000);
    return () => clearTimeout(handler);
  }, [attemptId, answers, flags, currentSubtestIndex, currentQuestionIndex]);

  // --- Attempt Restoration ---
  useEffect(() => {
    if (isAttemptLoading) return;
    if (!attempt) {
      setAttemptId(null);
      setExamState("ready");
      return;
    }
    let active = true;
    const data = attempt as TryoutAttempt;
    const run = async () => {
      const serverSubtest = data.currentSubtest ?? 0;
      const serverQuestion = data.currentQuestionIndex ?? 0;
      const storedAnswers = (data.answers as Record<string, AnswerMap> | null | undefined) || {};
      const storedFlags = (data.flags as Record<string, FlagMap> | null | undefined) || {};
      let finalSubtest = serverSubtest;
      let finalQuestion = serverQuestion;
      let finalSeconds: number | undefined;
      let finalExamState = data.examState;

      const mergedAnswers: Record<string, AnswerMap> = { ...storedAnswers };
      const mergedFlags: Record<string, FlagMap> = { ...storedFlags };

      const backup = await loadBackup(data.id);
      if (backup) {
        Object.keys(backup.answers || {}).forEach((subtestId) => {
          mergedAnswers[subtestId] = { ...(mergedAnswers[subtestId] || {}), ...backup.answers[subtestId] };
        });
        Object.keys(backup.flags || {}).forEach((subtestId) => {
          mergedFlags[subtestId] = { ...(mergedFlags[subtestId] || {}), ...backup.flags[subtestId] };
        });

        if (backup.currentSubtest > finalSubtest) {
          finalSubtest = backup.currentSubtest;
          finalQuestion = backup.currentQuestionIndex ?? 0;
          finalSeconds = backup.secondsRemaining;
          if (backup.examState) finalExamState = backup.examState as typeof finalExamState;
        } else if (backup.currentSubtest === finalSubtest) {
          finalQuestion = Math.max(finalQuestion, backup.currentQuestionIndex ?? 0);
          if (backup.secondsRemaining !== undefined && backup.updatedAt > (Date.parse(data.updatedAt) || 0)) {
            finalSeconds = backup.secondsRemaining;
          }
        }
      }

      const pendingEvents = await getPendingEvents(data.id);
      for (const event of pendingEvents) {
        if (event.kind === "answer") {
          const sub = mergedAnswers[event.subtestId] ? { ...mergedAnswers[event.subtestId] } : {};
          if (event.answerId !== undefined) sub[event.questionId] = event.answerId;
          mergedAnswers[event.subtestId] = sub;
        } else {
          const sub = mergedFlags[event.subtestId] ? { ...mergedFlags[event.subtestId] } : {};
          sub[event.questionId] = Boolean(event.flag);
          mergedFlags[event.subtestId] = sub;
        }
      }

      if (!active) return;
      setAttemptId(data.id);
      setCurrentSubtestIndex(finalSubtest);
      setCurrentQuestionIndex(finalQuestion);
      setAnswers(mergedAnswers);
      setFlags(mergedFlags);

      if (data.status === "completed") {
        setExamState("finished");
      } else if (data.status === "started") {
        const targetSubtest = subtests[finalSubtest];
        const defaultDuration = (targetSubtest?.duration ?? 0) * 60;
        setTimeLeft(finalSeconds ?? data.secondsRemaining ?? defaultDuration);
        setExamState(finalExamState || "running");
      }
    };
    run();
    return () => { active = false; };
  }, [attempt, isAttemptLoading, subtests]);

  // --- Auto Flush ---
  useEffect(() => {
    if (!attemptId) return;
    if (debouncedChangeToken === 0) return;
    flushEvents(false);
  }, [debouncedChangeToken, attemptId, flushEvents]);

  useEffect(() => {
    if (!attemptId) return;
    const timer = setInterval(() => { flushEvents(false); }, 12000);
    return () => clearInterval(timer);
  }, [attemptId, flushEvents]);

  useEffect(() => {
    const onOnline = () => flushEvents(true);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushEvents]);

  // --- Countdown Timer ---
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

  // --- Navigation Protection ---
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

  // --- Logic Handlers ---
  const handleStart = () => startAttemptMutation.mutate({ tryoutId: tryout.id });

  const handleSubtestFinish = useCallback(async () => {
    if (submitAttemptMutation.isPending) return;
    setShowConfirmFinish(false);

    if (currentSubtestIndex < subtests.length - 1) {
      setExamState("bridging");
    } else {
      if (attemptId) {
        // Queue: drain pending events → submit — all sequential
        const doSubmit = async () => {
          try {
            const pending = await getPendingEvents(attemptId, 50);
            if (pending.length > 0) {
              await saveProgressBatchMutation.mutateAsync({
                attemptId,
                batchId: createId(),
                clientTime: Date.now(),
                events: pending,
                currentSubtest: currentSubtestIndexRef.current,
                examState: undefined,
                secondsRemaining: timeLeftRef.current,
                currentQuestionIndex: currentQuestionIndexRef.current,
              });
              await markEventsSent(attemptId, pending.map((e) => e.id));
            }
          } catch { /* proceed to submit anyway */ }

          await submitAttemptMutation.mutateAsync({ attemptId, answers: answersRef.current });
        };

        writeQueueRef.current = writeQueueRef.current.then(doSubmit).catch(() => {});
      } else {
        setExamState("finished");
        onFinish(answers);
      }
    }
  }, [currentSubtestIndex, subtests.length, attemptId, answers, onFinish, submitAttemptMutation, saveProgressBatchMutation, createId]);

  // Time up auto-finish
  useEffect(() => {
    if (showTimeUpDialog) {
      const timeout = setTimeout(() => {
        setShowTimeUpDialog(false);
        handleSubtestFinish();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showTimeUpDialog, handleSubtestFinish]);

  const handleNextSubtest = useCallback(() => {
    const nextIdx = currentSubtestIndex + 1;
    setCurrentSubtestIndex(nextIdx);
    setCurrentQuestionIndex(0);
    const nextDuration = subtests[nextIdx]?.duration ?? 0;
    setTimeLeft(nextDuration * 60);
    setExamState("running");
    flushEvents(true);
  }, [currentSubtestIndex, subtests, flushEvents]);

  const triggerFinishCheck = useCallback(() => {
    const answeredCount = currentSubtestId ? Object.keys(answers[currentSubtestId] || {}).length : 0;
    if (answeredCount < questions.length) {
      setShowConfirmFinish(true);
    } else {
      handleSubtestFinish();
    }
  }, [answers, currentSubtestId, questions.length, handleSubtestFinish]);

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    flushEvents(false);
  }, [flushEvents]);

  const handlePrevQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
    flushEvents(false);
  }, [flushEvents]);

  const setCurrentQuestionIndexWithFlush = useCallback((idx: number) => {
    setCurrentQuestionIndex(idx);
    flushEvents(false);
  }, [flushEvents]);

  const queueEvent = useCallback(async (event: Omit<TryoutEvent, "id" | "attemptId" | "clientTs" | "revision">) => {
    if (!attemptId) return;
    const key = `${event.kind}-${event.subtestId}-${event.questionId}`;
    const nextRev = (revisionRef.current[key] ?? 0) + 1;
    revisionRef.current[key] = nextRev;
    await appendEvent(attemptId, {
      ...event,
      id: createId(),
      attemptId,
      clientTs: Date.now(),
      revision: nextRev,
    });
    setChangeToken((prev) => prev + 1);
    const pending = await getPendingEvents(attemptId, 8);
    if (pending.length >= 8) flushEvents(false);
  }, [attemptId, createId, flushEvents]);
  
  const handleAnswer = useCallback((qId: string, aId: string) => {
    if (!currentSubtestId) return;
    setAnswers(prev => ({ ...prev, [currentSubtestId]: { ...(prev[currentSubtestId] || {}), [qId]: aId } }));
    queueEvent({ kind: "answer", subtestId: currentSubtestId, questionId: qId, answerId: aId });
  }, [currentSubtestId, queueEvent]);

  const toggleFlag = useCallback((qId: string) => {
    if (!currentSubtestId) return;
    const nextFlag = !flagsRef.current[currentSubtestId]?.[qId];
    setFlags(prev => ({ ...prev, [currentSubtestId]: { ...(prev[currentSubtestId] || {}), [qId]: nextFlag } }));
    queueEvent({ kind: "flag", subtestId: currentSubtestId, questionId: qId, flag: nextFlag });
  }, [currentSubtestId, queueEvent]);

  // --- Bridging Timer ---
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

  return {
    // Derived data
    subtests,
    currentSubtestIndex,
    currentSubtestId,
    currentSubtest,
    currentQuestionIndex,
    currentQuestion,
    questions,
    subtestLabel,
    answers,
    flags,
    timeLeft,
    examState,
    attemptId,
    bridgingSeconds,
    isAttemptLoading,

    // Dialog state
    showConfirmFinish, setShowConfirmFinish,
    showExitDialog, setShowExitDialog,
    showTimeUpDialog, setShowTimeUpDialog,

    // Mutations state
    startAttemptMutation,
    submitAttemptMutation,

    // Handlers
    handleStart,
    handleSubtestFinish,
    handleNextSubtest,
    handleNextQuestion,
    handlePrevQuestion,
    handleAnswer,
    toggleFlag,
    triggerFinishCheck,
    setCurrentQuestionIndexWithFlush,
    formatTime,
    router,
  };
}
