"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useDebounce } from "@/hooks/use-debounce";
import { usePostHog } from "posthog-js/react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
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
  subtestDurations: Record<string, number>;
}

export interface ServerTimingSyncPayload {
  currentSubtest?: number;
  subtestStartedAt?: string;
  subtestDeadlineAt?: string;
  serverNow?: string;
  secondsRemaining?: number;
}

type SaveProgressBatchInput = {
  attemptId: string;
  batchId: string;
  clientTime: number;
  events: TryoutEvent[];
  currentSubtest: number;
  examState?: "running" | "bridging";
  currentQuestionIndex: number;
};

type SaveProgressBatchOutput = ServerTimingSyncPayload & {
  success: boolean;
  duplicate?: boolean;
  applied?: number;
};

export function useExamSync({
  attemptId,
  state,
  timeLeft,
  onServerTiming,
  tryoutId,
}: {
  attemptId: string | null;
  state: SyncState;
  timeLeft: number;
  onServerTiming?: (payload: ServerTimingSyncPayload) => void;
  tryoutId?: string;
}) {
  const posthog = usePostHog();
  const stateRef = useRef(state);
  const timeLeftRef = useRef(timeLeft);
  const onServerTimingRef = useRef(onServerTiming);
  const offlineRef = useRef(false);
  const syncFailedRef = useRef(false);
  
  useEffect(() => {
    stateRef.current = state;
    timeLeftRef.current = timeLeft;
  }, [state, timeLeft]);

  useEffect(() => {
    onServerTimingRef.current = onServerTiming;
  }, [onServerTiming]);

  const trpc = useTRPC();
  const [changeToken, setChangeToken] = useState(0);
  const debouncedChangeToken = useDebounce(changeToken, 4000);

  const revisionRef = useRef<Record<string, number>>({});
  const lastRetryAtRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedStateRef = useRef<{
    currentSubtestIndex: number;
    status: ExamState["status"];
  } | null>(null);
  
  const writeQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const flushEventsRef = useRef<
    (force?: boolean, overrideState?: Partial<SyncState>) => Promise<ServerTimingSyncPayload | null>
  >(() => Promise.resolve(null));

  const saveProgressBatchMutation = useMutation<
    SaveProgressBatchOutput,
    TRPCClientErrorLike<AppRouter>,
    SaveProgressBatchInput
  >(
    trpc.tryoutAttempts.saveProgressBatch.mutationOptions({
      retry: false,
      onError: () => {},
    }) as unknown as UseMutationOptions<
      SaveProgressBatchOutput,
      TRPCClientErrorLike<AppRouter>,
      SaveProgressBatchInput
    >
  );

  const createId = useCallback(() => {
    return Math.random().toString(36).substring(2, 10);
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
    async (force?: boolean, overrideState?: Partial<SyncState>) => {
      if (!attemptId) return null;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!offlineRef.current) {
          offlineRef.current = true;
          posthog.capture("tryout_offline_detected", {
            attempt_id: attemptId,
            tryout_id: tryoutId,
          });
        }
        scheduleRetry(0);
        return null;
      }

      const doFlush = async (): Promise<ServerTimingSyncPayload | null> => {
        let pending: TryoutEvent[] = [];
        try {
          pending = await getPendingEvents(attemptId, 20);
          const currentState = { ...stateRef.current, ...(overrideState ?? {}) };
          const persistedExamState =
            currentState.status === "running" || currentState.status === "bridging"
              ? currentState.status
              : undefined;
          const lastSynced = lastSyncedStateRef.current;
          const hasStateChanged =
            !lastSynced ||
            lastSynced.currentSubtestIndex !== currentState.currentSubtestIndex ||
            lastSynced.status !== currentState.status;
          const shouldSendStateOnly =
            pending.length === 0 && Boolean(force || hasStateChanged);

          if (pending.length === 0 && !shouldSendStateOnly) return null;

          const result = await saveProgressBatchMutation.mutateAsync({
            attemptId,
            batchId: createId(),
            clientTime: Date.now(),
            events: pending,
            currentSubtest: currentState.currentSubtestIndex,
            examState: persistedExamState,
            currentQuestionIndex: currentState.currentQuestionIndex,
          });
          lastSyncedStateRef.current = {
            currentSubtestIndex: currentState.currentSubtestIndex,
            status: currentState.status,
          };

          const resultRecord = result as unknown as Record<string, unknown>;
          const timingPayload: ServerTimingSyncPayload = {};
          if (typeof resultRecord.currentSubtest === "number") {
            timingPayload.currentSubtest = resultRecord.currentSubtest;
          }
          if (typeof resultRecord.subtestStartedAt === "string") {
            timingPayload.subtestStartedAt = resultRecord.subtestStartedAt;
          }
          if (typeof resultRecord.subtestDeadlineAt === "string") {
            timingPayload.subtestDeadlineAt = resultRecord.subtestDeadlineAt;
          }
          if (typeof resultRecord.serverNow === "string") {
            timingPayload.serverNow = resultRecord.serverNow;
          }
          if (typeof resultRecord.secondsRemaining === "number") {
            timingPayload.secondsRemaining = resultRecord.secondsRemaining;
          }
          if (Object.keys(timingPayload).length > 0) {
            onServerTimingRef.current?.(timingPayload);
          }

          await markEventsSent(
            attemptId,
            pending.map((e) => e.id)
          );
          if (syncFailedRef.current) {
            syncFailedRef.current = false;
            posthog.capture("tryout_sync_recovered", {
              attempt_id: attemptId,
              tryout_id: tryoutId,
            });
          }

          const more = await getPendingEvents(attemptId, 1);
          if (more.length > 0) {
            const next = await doFlush();
            return next ?? (Object.keys(timingPayload).length > 0 ? timingPayload : null);
          }

          return Object.keys(timingPayload).length > 0 ? timingPayload : null;
        } catch {
          await markEventsFailed(
            attemptId,
            pending.map((e) => e.id)
          );
          const maxFail = pending.reduce(
            (acc, e) => Math.max(acc, (e.failedCount ?? 0) + 1),
            0
          );
          if (!syncFailedRef.current) {
            syncFailedRef.current = true;
            posthog.capture("tryout_sync_failed", {
              attempt_id: attemptId,
              tryout_id: tryoutId,
              pending_events: pending.length,
              max_fail_count: maxFail,
            });
          }
          scheduleRetry(maxFail);
          return null;
        }
      };

      if (force) {
        const queued = writeQueueRef.current.then(doFlush).catch(() => null);
        writeQueueRef.current = queued;
        return await queued;
      }

      writeQueueRef.current = writeQueueRef.current
        .then(doFlush)
        .catch(() => null);
      return null;
    },
    [attemptId, createId, saveProgressBatchMutation, scheduleRetry, posthog, tryoutId]
  );

  useEffect(() => {
    lastSyncedStateRef.current = null;
  }, [attemptId]);

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
  }, [attemptId, flushEvents, posthog, tryoutId]);

  useEffect(() => {
    if (!attemptId) return;

    const onOnline = () => {
      offlineRef.current = false;
      posthog.capture("tryout_back_online", {
        attempt_id: attemptId,
        tryout_id: tryoutId,
      });
      flushEvents(true);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveBackup(attemptId, {
          answers: stateRef.current.answers,
          flags: stateRef.current.flags,
          currentSubtest: stateRef.current.currentSubtestIndex,
          currentQuestionIndex: stateRef.current.currentQuestionIndex,
          examState: stateRef.current.status,
          secondsRemaining: timeLeftRef.current,
          subtestDurations: stateRef.current.subtestDurations,
        });
        posthog.capture("tryout_backup_saved", {
          attempt_id: attemptId,
          tryout_id: tryoutId,
          current_subtest: stateRef.current.currentSubtestIndex,
          current_question: stateRef.current.currentQuestionIndex,
          exam_state: stateRef.current.status,
        });
        flushEvents(true);
      }
    };

    const onPageHide = () => {
      const s = stateRef.current;
      saveBackup(attemptId, {
        answers: s.answers,
        flags: s.flags,
        currentSubtest: s.currentSubtestIndex,
        currentQuestionIndex: s.currentQuestionIndex,
        examState: s.status,
        secondsRemaining: timeLeftRef.current,
        subtestDurations: s.subtestDurations,
      });
      posthog.capture("tryout_page_hidden", {
        attempt_id: attemptId,
        tryout_id: tryoutId,
        current_subtest: s.currentSubtestIndex,
        current_question: s.currentQuestionIndex,
        exam_state: s.status,
      });
      flushEvents(true);
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [attemptId, flushEvents, posthog, tryoutId]);

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
        subtestDurations: s.subtestDurations,
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
