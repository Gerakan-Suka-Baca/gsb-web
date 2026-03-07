"use client";

import { useEffect, useRef } from "react";
import type { ExamAction, ExamStatus } from "./useExamState";

interface UseExamDialogsProps {
  status: ExamStatus;
  bridgingSeconds: number;
  dispatch: (action: ExamAction) => void;
  onBridgingComplete?: () => void;
}

/**
 * Manages the bridging countdown between subtests.
 * When status enters "bridging", it starts a 1-second countdown
 * from 60 → 0 and auto-advances to the next subtest when it reaches 0.
 */
export function useExamDialogs({
  status,
  bridgingSeconds,
  dispatch,
  onBridgingComplete,
}: UseExamDialogsProps) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset bridging seconds when NOT in bridging state
    if (status !== "bridging") {
      dispatch({ type: "SET_BRIDGING_SECONDS", seconds: 60 });
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start countdown when entering bridging state
    timerRef.current = setInterval(() => {
      dispatch({ type: "SET_BRIDGING_SECONDS", seconds: -1 }); // decrement by 1
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, dispatch]);

  // Auto-advance when countdown reaches 0
  useEffect(() => {
    if (status === "bridging" && bridgingSeconds <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onBridgingComplete?.();
    }
  }, [status, bridgingSeconds, onBridgingComplete]);
}
