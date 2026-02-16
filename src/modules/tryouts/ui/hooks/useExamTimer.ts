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
    // Prevent starting if invalid duration or not running
    if (!isRunning || initialSeconds <= 0) return;

    // Reset if initialSeconds changes to a valid number
    setTimeLeft((prev) => {
       // Only reset if we are significantly off (e.g. new subtest)
       // or if we are currently at 0 (from previous state)
       if (prev === 0) return initialSeconds;
       return prev;
    });

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
  }, [isRunning, initialSeconds]);

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
