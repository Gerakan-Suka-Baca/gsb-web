"use client";

import { useEffect } from "react";
import type { ExamAction, ExamStatus } from "./useExamState";

interface UseExamDialogsProps {
  status: ExamStatus;
  bridgingSeconds: number;
  timeUpDialog: boolean;
  onNextSubtest: () => void;
  onFinish: () => void;
  dispatch: (action: ExamAction) => void;
}

export function useExamDialogs({
  status,
  bridgingSeconds,
  timeUpDialog,
  onNextSubtest,
  onFinish,
  dispatch,
}: UseExamDialogsProps) {
  useEffect(() => {
    if (status !== "bridging") {
      if (bridgingSeconds !== 60) dispatch({ type: "SET_BRIDGING_SECONDS", seconds: 60 });
      return;
    }
    
    const timer = setInterval(() => {
      if (bridgingSeconds <= 1) {
        clearInterval(timer);
        onNextSubtest();
      } else {
        dispatch({ type: "SET_BRIDGING_SECONDS", seconds: bridgingSeconds - 1 });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, bridgingSeconds, onNextSubtest, dispatch]);

  useEffect(() => {
    if (!timeUpDialog) return;
    
    const timeout = setTimeout(() => {
      dispatch({ type: "SET_DIALOG", dialog: "timeUp", open: false });
      onFinish();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [timeUpDialog, onFinish, dispatch]);
}
