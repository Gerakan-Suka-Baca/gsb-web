"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseExamTimerProps {
  initialSeconds: number;
  isRunning: boolean;
  deadlineAt?: string | null;
  serverNow?: string | null;
  onTimeUp: () => void;
}

const parseDateMs = (value: string | null | undefined): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export function useExamTimer({
  initialSeconds,
  isRunning,
  deadlineAt,
  serverNow,
  onTimeUp,
}: UseExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, initialSeconds));
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredTimeUpRef = useRef(false);
  const clockOffsetMsRef = useRef(0);
  const lastDeadlineRef = useRef<string | null>(null);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    const serverNowMs = parseDateMs(serverNow);
    if (serverNowMs === null) return;
    // Keep a small drift correction to align UI countdown with server clock.
    clockOffsetMsRef.current = serverNowMs - Date.now();
  }, [serverNow]);

  const resolveRemainingByDeadline = useCallback(
    (value: string | null | undefined): number | null => {
      const deadlineMs = parseDateMs(value);
      if (deadlineMs === null) return null;
      const nowMs = Date.now() + clockOffsetMsRef.current;
      return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
    },
    []
  );

  useEffect(() => {
    const hasValidDeadline = resolveRemainingByDeadline(deadlineAt) !== null;
    if (!hasValidDeadline) {
      lastDeadlineRef.current = null;
      return;
    }

    if (deadlineAt !== lastDeadlineRef.current) {
      hasTriggeredTimeUpRef.current = false;
      lastDeadlineRef.current = deadlineAt ?? null;
    }

    const syncFromDeadline = () => {
      const remaining = resolveRemainingByDeadline(deadlineAt);
      if (remaining === null) return;
      setTimeLeft(remaining);
      if (remaining <= 0 && !hasTriggeredTimeUpRef.current) {
        hasTriggeredTimeUpRef.current = true;
        onTimeUpRef.current();
      }
    };

    syncFromDeadline();
    if (!isRunning) return;

    const timer = setInterval(() => {
      syncFromDeadline();
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineAt, isRunning, resolveRemainingByDeadline]);

  useEffect(() => {
    const hasValidDeadline = resolveRemainingByDeadline(deadlineAt) !== null;
    if (hasValidDeadline) return;
    if (!isRunning || initialSeconds <= 0) return;

    hasTriggeredTimeUpRef.current = false;
    setTimeLeft((prev) => {
      if (prev <= 0) return initialSeconds;
      if (Math.abs(prev - initialSeconds) > 2) return initialSeconds;
      return prev;
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasTriggeredTimeUpRef.current) {
            hasTriggeredTimeUpRef.current = true;
            onTimeUpRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineAt, initialSeconds, isRunning, resolveRemainingByDeadline]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    return `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    setTimeLeft,
    formatTime,
  };
}
