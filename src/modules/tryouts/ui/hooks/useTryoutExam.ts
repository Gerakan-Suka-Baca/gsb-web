import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useTRPC } from "@/trpc/client";
import { useExamNavbar } from "@/components/layout/exam-navbar-context";
import { saveBackup, loadBackup, clearBackup } from "@/lib/tryout-storage";
import type { Question, Tryout, TryoutAttempt } from "@/payload-types";

type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;
type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];

export type AttemptData = Omit<TryoutAttempt, "answers" | "flags"> & {
  answers?: Record<string, AnswerMap> | null;
  flags?: Record<string, FlagMap> | null;
  currentSubtest?: number | null;
  examState?: "running" | "bridging" | null;
  secondsRemaining?: number | null;
  currentQuestionIndex?: number | null;
};

export const useTryoutExam = (tryout: Tryout, onFinish: (answers: Record<string, AnswerMap>) => void) => {
  const trpc = useTRPC();
  useExamNavbar();

  const subtests = useMemo(() => (tryout.questions as Question[]) || [], [tryout.questions]);

  // Initialize subtest index from localStorage (sync) if safe to prevent flash
  const [currentSubtestIndex, setCurrentSubtestIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`gsb-subtest-${tryout.id}`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerMap>>({});
  const [flags, setFlags] = useState<Record<string, FlagMap>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examState, setExamState] = useState<"loading" | "ready" | "running" | "bridging" | "finished">("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timeLeftRef = useRef(timeLeft);
  const currentSubtestIndexRef = useRef(currentSubtestIndex);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const examStateRef = useRef(examState);
  const answersRef = useRef(answers);
  const flagsRef = useRef(flags);
  const isSavingRef = useRef(false);
  const failCountRef = useRef(0);
  const pausedUntilRef = useRef(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerActiveRef = useRef(false);
  const timerStartRef = useRef(0);
  const timeLeftAtStartRef = useRef(0);


  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { currentSubtestIndexRef.current = currentSubtestIndex; }, [currentSubtestIndex]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { examStateRef.current = examState; }, [examState]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);


  useEffect(() => {
    if (tryout.id) {
      localStorage.setItem(`gsb-subtest-${tryout.id}`, currentSubtestIndex.toString());
    }
  }, [currentSubtestIndex, tryout.id]);

  const debouncedAnswers = useDebounce(answers, 10000);
  const debouncedFlags = useDebounce(flags, 10000);

  const currentSubtest = subtests[currentSubtestIndex];
  const currentSubtestId = currentSubtest?.id ?? "";
  const questions = useMemo(() => (currentSubtest?.tryoutQuestions || []) as SubtestQuestion[], [currentSubtest?.tryoutQuestions]);
  const currentQuestion = questions[currentQuestionIndex];

  const startAttemptMutation = useMutation(trpc.tryoutAttempts.startAttempt.mutationOptions({
    onSuccess: (data) => {
      setAttemptId(data.id);
      setExamState("running");
      const duration = (currentSubtest?.duration ?? tryout.duration ?? 0) * 60;
      setTimeLeft(duration);
      toast.success("Ujian dimulai!");
    },
    onError: (err) => toast.error("Gagal memulai: " + err.message),
  }));

  const saveProgressMutation = useMutation(trpc.tryoutAttempts.saveProgress.mutationOptions({
    retry: false,
    onError: () => {}, // Handled by circuit breaker logic
  }));

  const submitAttemptMutation = useMutation(trpc.tryoutAttempts.submitAttempt.mutationOptions({
    retry: 3,
    // Exponential backoff: 2s, 4s, 8s (max 10s)
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    onSuccess: () => {
      setExamState("finished");
      if (attemptId) {
        clearBackup(attemptId);
        localStorage.removeItem(`gsb-subtest-${tryout.id}`); // Clean up sync backup
      }
      toast.success("Ujian selesai! Jawaban tersimpan.");
      setIsSubmitting(false); 
      onFinish(answers);
    },
    onError: (err) => {
      setIsSubmitting(false);
      toast.error("Gagal submit: " + err.message);
    },
  }));

  const { data: attempt, isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId: tryout.id })
  );

  const doSave = useCallback((force?: boolean) => {
    const aid = attemptId;
    if (!aid) return;
    

    if (!force) {
      if (isSavingRef.current) return;
      if (failCountRef.current >= 3 && Date.now() < pausedUntilRef.current) return;
    }
    
    if (failCountRef.current >= 3 && Date.now() >= pausedUntilRef.current) {
        failCountRef.current = 0; // Reset after pause
    }

    const currentAnswers = answersRef.current;
    const currentFlags = flagsRef.current;
    const es = examStateRef.current;
    const persistedExamState = es === "running" || es === "bridging" ? es : undefined;

    isSavingRef.current = true;
    saveProgressMutation.mutate({
      attemptId: aid, answers: currentAnswers, flags: currentFlags,
      currentSubtest: currentSubtestIndexRef.current,
      examState: persistedExamState,
      secondsRemaining: timeLeftRef.current,
      currentQuestionIndex: currentQuestionIndexRef.current,
    }, {
      onSuccess: () => {
        isSavingRef.current = false;
        failCountRef.current = 0;
      },
      onError: () => {
        isSavingRef.current = false;
        failCountRef.current += 1;
        if (failCountRef.current >= 3) {
          pausedUntilRef.current = Date.now() + 60_000;
        }
      },
    });
  }, [attemptId, saveProgressMutation]);

  const doSaveRef = useRef(doSave);
  useEffect(() => { doSaveRef.current = doSave; }, [doSave]);

  useEffect(() => {
    if (isAttemptLoading) return;
    if (!attempt) {
      setExamState("ready");
      return;
    }
    const data = attempt as AttemptData;
    const serverSubtest = data.currentSubtest ?? 0;
    const serverQuestion = data.currentQuestionIndex ?? 0;
    

    let localSubtest = serverSubtest;
    if (typeof window !== "undefined") {
        const savedSubtest = localStorage.getItem(`gsb-subtest-${tryout.id}`);
        if(savedSubtest) localSubtest = Math.max(serverSubtest, parseInt(savedSubtest, 10));
    }

    setAttemptId(data.id);

    const initialAnswers: Record<string, AnswerMap> = data.answers || {};
    const initialFlags: Record<string, FlagMap> = data.flags || {};

    loadBackup(data.id).then(backup => {
      let finalSubtest = localSubtest;
      let finalQuestion = serverQuestion;
      let finalSeconds: number | undefined;
      let finalExamState = data.examState;

      if (backup) {
        // Merge answers/flags
        if (backup.answers) {
          Object.keys(backup.answers).forEach(subtestId => {
            initialAnswers[subtestId] = { ...(initialAnswers[subtestId] || {}), ...backup.answers[subtestId] };
          });
        }
        if (backup.flags) {
          Object.keys(backup.flags).forEach(subtestId => {
            initialFlags[subtestId] = { ...(initialFlags[subtestId] || {}), ...backup.flags[subtestId] };
          });
        }


        if (backup.currentSubtest > finalSubtest) {
          finalSubtest = backup.currentSubtest;
          finalQuestion = backup.currentQuestionIndex ?? 0;
          finalSeconds = backup.secondsRemaining;
          if (backup.examState) finalExamState = backup.examState as typeof finalExamState;
        } else if (backup.currentSubtest === finalSubtest) {
             // Only update question index if meaningful diff and same subtest
             finalQuestion = Math.max(finalQuestion, backup.currentQuestionIndex ?? 0);
             if (backup.secondsRemaining !== undefined && backup.updatedAt > (Date.parse(data.updatedAt) || 0)) {
                 finalSeconds = backup.secondsRemaining;
             }
        }
      }

      setCurrentSubtestIndex(finalSubtest);
      setCurrentQuestionIndex(finalQuestion);
      setAnswers(initialAnswers);
      setFlags(initialFlags);

      if (data.status === "completed") {
        setExamState("finished");
      } else if (data.status === "started") {
        const subtestAtIndex = subtests[finalSubtest];
        const defaultDuration = (subtestAtIndex?.duration ?? tryout.duration ?? 0) * 60;
        setTimeLeft(finalSeconds ?? data.secondsRemaining ?? defaultDuration);
        setExamState(finalExamState || "running");
      }
    }).catch(() => {

      setCurrentSubtestIndex(localSubtest);
      setCurrentQuestionIndex(serverQuestion);
      setAnswers(initialAnswers);
      setFlags(initialFlags);

       if (data.status === "completed") {
        setExamState("finished");
      } else if (data.status === "started") {
        const defaultDuration = (currentSubtest?.duration ?? tryout.duration ?? 0) * 60;
        setTimeLeft(data.secondsRemaining ?? defaultDuration);
        setExamState(data.examState || "running");
      }
    });
  }, [attempt, isAttemptLoading, subtests, tryout.id, tryout.duration, currentSubtest?.duration]); // attemptId dependence via attempt

  useEffect(() => {
    if (!attemptId) return;
    saveBackup(attemptId, {
      answers, flags,
      currentSubtest: currentSubtestIndexRef.current,
      currentQuestionIndex: currentQuestionIndexRef.current,
      examState: examStateRef.current,
      secondsRemaining: timeLeftRef.current,
    });
  }, [answers, flags, currentSubtestIndex, currentQuestionIndex, attemptId]);


  useEffect(() => {
    const hasProgress = Object.keys(debouncedAnswers).length > 0 || Object.keys(debouncedFlags).length > 0;
    if (hasProgress && attemptId) {
      // Auto-save to server
      doSaveRef.current(false);
    }
  }, [debouncedAnswers, debouncedFlags, attemptId]);

  const startTimer = useCallback((seconds: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerActiveRef.current = true;
    timerStartRef.current = Date.now();
    timeLeftAtStartRef.current = seconds;
    setTimeLeft(seconds);

    timerIntervalRef.current = setInterval(() => {
      if (!timerActiveRef.current) return;
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      const remaining = Math.max(0, timeLeftAtStartRef.current - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        timerActiveRef.current = false;
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    timerActiveRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (examState === "running" && timeLeft > 0 && !timerActiveRef.current) {
      startTimer(timeLeft);
    } else if (examState !== "running") {
      stopTimer();
    }
    return () => stopTimer();
  }, [examState, startTimer, stopTimer, timeLeft]);

  const handleNextSubtest = useCallback(() => {
    const nextIdx = currentSubtestIndex + 1;
    const nextSubtest = subtests[nextIdx];
    const nextDuration = nextSubtest?.duration ?? 0;
    
    // Update state
    setCurrentSubtestIndex(nextIdx);
    setCurrentQuestionIndex(0);
    setTimeLeft(nextDuration * 60);
    setExamState("running");


    if (attemptId) {
      doSaveRef.current(true);

      saveBackup(attemptId, {
        answers: answersRef.current,
        flags: flagsRef.current,
        currentSubtest: nextIdx,
        currentQuestionIndex: 0,
        examState: "running",
        secondsRemaining: nextDuration * 60
      });
    }
  }, [currentSubtestIndex, subtests, attemptId]);
  
  const finishExam = useCallback(() => {
      if(!attemptId) return;
      setIsSubmitting(true);
      submitAttemptMutation.mutate({ attemptId, answers });
  }, [attemptId, answers, submitAttemptMutation]);

  return {

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
      setAnswers,
      setFlags,
      setExamState,
      startAttempt: () => startAttemptMutation.mutate({ tryoutId: tryout.id }),
      handleNextSubtest,
      handleAnswer: (qId: string, aId: string) => {
          if (!currentSubtestId) return;
          setAnswers(prev => ({ ...prev, [currentSubtestId]: { ...(prev[currentSubtestId] || {}), [qId]: aId } }));
      },
      toggleFlag: (qId: string) => {
          if (!currentSubtestId) return;
          setFlags(prev => ({ ...prev, [currentSubtestId]: { ...(prev[currentSubtestId] || {}), [qId]: !prev[currentSubtestId]?.[qId] } }));
      },
      finishExam,
      triggerFinishCheck: () => {}, // Handled in UI layer or exposes logic
      doSave: doSaveRef.current
  };
};
