"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useDebounce } from "@/hooks/use-debounce";
import {
  appendEvent,
  clearBackup,
  clearEvents,
  getPendingEvents,
  markEventsFailed,
  markEventsSent,
  saveBackup,
  type TryoutEvent,
} from "@/lib/tryout-storage";
import type { AnswerMap, FlagMap, ExamState } from "./useExamState";


export interface SyncState {
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentSubtestIndex: number;
  currentQuestionIndex: number;
  status: ExamState["status"];
}

export function useExamSync({ attemptId, state, timeLeft }: { attemptId: string | null, state: SyncState, timeLeft: number }) {
  const stateRef = useRef(state);
  const timeLeftRef = useRef(timeLeft);
  
  useEffect(() => {
    stateRef.current = state;
    timeLeftRef.current = timeLeft;
  }, [state, timeLeft]);

  const trpc = useTRPC();
  const [changeToken, setChangeToken] = useState(0);
  const debouncedChangeToken = useDebounce(changeToken, 4000);

  const revisionRef = useRef<Record<string, number>>({});
  const lastRetryAtRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const flushEventsRef = useRef<(force?: boolean) => void>(() => {});

  const saveProgressBatchMutation = useMutation(
    trpc.tryoutAttempts.saveProgressBatch.mutationOptions({
      retry: false,
      onError: () => {},
    })
  );

  const createId = useCallback(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

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

  const flushEvents = useCallback(
    async (force?: boolean) => {
      if (!attemptId) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        scheduleRetry(0);
        return;
      }

      const doFlush = async () => {
        let pending: TryoutEvent[] = [];
        try {
          pending = await getPendingEvents(attemptId, 20);
          if (pending.length === 0) return;

          const currentState = stateRef.current;
          const persistedExamState =
            currentState.status === "running" || currentState.status === "bridging"
              ? currentState.status
              : undefined;

          await saveProgressBatchMutation.mutateAsync({
            attemptId,
            batchId: createId(),
            clientTime: Date.now(),
            events: pending,
            currentSubtest: currentState.currentSubtestIndex,
            examState: persistedExamState,
            secondsRemaining: timeLeftRef.current,
            currentQuestionIndex: currentState.currentQuestionIndex,
          });
          await markEventsSent(
            attemptId,
            pending.map((e) => e.id)
          );

          const more = await getPendingEvents(attemptId, 1);
          if (more.length > 0) await doFlush();
        } catch {
          await markEventsFailed(
            attemptId,
            pending.map((e) => e.id)
          );
          const maxFail = pending.reduce(
            (acc, e) => Math.max(acc, (e.failedCount ?? 0) + 1),
            0
          );
          scheduleRetry(maxFail);
        }
      };

      if (force) {
        const queued = writeQueueRef.current.then(doFlush).catch(() => {});
        writeQueueRef.current = queued;
        await queued;
      } else {
        writeQueueRef.current = writeQueueRef.current
          .then(doFlush)
          .catch(() => {});
      }
    },
    [attemptId, createId, saveProgressBatchMutation, scheduleRetry, stateRef, timeLeftRef]
  );

  useEffect(() => {
    flushEventsRef.current = flushEvents;
  }, [flushEvents]);

  const queueEvent = useCallback(
    async (
      event: Omit<TryoutEvent, "id" | "attemptId" | "clientTs" | "revision">
    ) => {
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
    },
    [attemptId, createId, flushEvents]
  );

  useEffect(() => {
    if (!attemptId) return;
    if (debouncedChangeToken === 0) return;
    flushEvents(false);
  }, [debouncedChangeToken, attemptId, flushEvents]);

  useEffect(() => {
    if (!attemptId) return;
    const timer = setInterval(() => {
      flushEvents(false);
    }, 12000);
    return () => clearInterval(timer);
  }, [attemptId, flushEvents]);

  useEffect(() => {
    const onOnline = () => flushEvents(true);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushEvents]);

  useEffect(() => {
    if (!attemptId) return;
    const handler = setTimeout(() => {
      const s = stateRef.current;
      saveBackup(attemptId, {
        answers: s.answers,
        flags: s.flags,
        currentSubtest: s.currentSubtestIndex,
        currentQuestionIndex: s.currentQuestionIndex,
        examState: s.status,
        secondsRemaining: timeLeftRef.current,
      });
    }, 1000);
    return () => clearTimeout(handler);
  }, [attemptId, changeToken, stateRef, timeLeftRef]);

  const clearSyncData = useCallback(async () => {
    if (!attemptId) return;
    await clearBackup(attemptId);
    await clearEvents(attemptId);
  }, [attemptId]);

  return {
    queueEvent,
    flushEvents,
    clearSyncData,
    saveProgressBatchMutation
  };
}
