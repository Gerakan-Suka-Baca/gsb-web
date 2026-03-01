"use client";

import { useEffect } from "react";
import type { ExamAction, ExamStatus } from "./useExamState";

interface UseExamDialogsProps {
  status: ExamStatus;
  bridgingSeconds: number;
  dispatch: (action: ExamAction) => void;
}

export function useExamDialogs({
  status,
  bridgingSeconds,
  dispatch,
}: UseExamDialogsProps) {
  useEffect(() => {
    if (status !== "bridging") {
      if (bridgingSeconds !== 60) dispatch({ type: "SET_BRIDGING_SECONDS", seconds: 60 });
      return;
    }
  }, [status, bridgingSeconds, dispatch]);
}
