"use client";

import { useEffect, useState, useRef } from "react";

interface UseExamTimerProps {
  initialSeconds: number;
  isRunning: boolean;
  onTimeUp: () => void;
}

export function useExamTimer({ initialSeconds, isRunning, onTimeUp }: UseExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);



  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

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
