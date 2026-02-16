"use client";

import { useEffect, useRef } from "react";

interface UseNavigationProtectionProps {
  isEnabled: boolean;
  onPopState: () => void;
}

export function useNavigationProtection({ isEnabled, onPopState }: UseNavigationProtectionProps) {
  const onPopStateRef = useRef(onPopState);

  useEffect(() => {
    onPopStateRef.current = onPopState;
  }, [onPopState]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      onPopStateRef.current();
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isEnabled]);
}
