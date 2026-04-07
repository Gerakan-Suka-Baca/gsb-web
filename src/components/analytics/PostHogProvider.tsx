"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useRef } from "react";
import PostHogPageView from "./PostHogPageView";

/**
 * Deferred PostHog analytics provider.
 * Initialization is pushed to requestIdleCallback so the ~120 KiB
 * PostHog bundle does not block LCP or main-thread work during
 * first paint.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key || !host) {
      console.warn("PostHog environment variables are missing.");
      return;
    }

    // Defer initialization until the browser is idle (after LCP)
    const init = () => {
      if (initialized.current) return;
      initialized.current = true;
      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(init, { timeout: 3500 });
    } else {
      // Safari fallback: defer by 3.5s
      setTimeout(init, 3500);
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
