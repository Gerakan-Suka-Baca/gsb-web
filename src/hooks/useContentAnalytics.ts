"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export interface ContentAnalyticsProps {
  title: string;
  slug: string;
  category: "Article" | "Legal" | "Page";
  author?: string;
  labels?: string[];
  publishedDate?: string;
  wordCount?: number;
}

export function useContentAnalytics({
  title,
  slug,
  category,
  author,
  labels,
  publishedDate,
  wordCount,
}: ContentAnalyticsProps) {
  const posthog = usePostHog();
  const pathname = usePathname();
  const startTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const [readComplete, setReadComplete] = useState(false);
  const readCompleteRef = useRef(false);

  // Estimate read time: 200 words per minute. Minimum 30s.
  const estimatedReadTime = wordCount ? Math.max(30, Math.ceil(wordCount / 200) * 60) : 60; 

  useEffect(() => {
    if (!posthog) return;

    startTime.current = Date.now();
    maxScrollDepth.current = 0;
    setReadComplete(false);
    readCompleteRef.current = false;

    // 1. Track View on Mount
    posthog.capture("content_viewed", {
      title,
      slug,
      category,
      author,
      labels,
      published_date: publishedDate,
      url: window.location.href,
    });

    const trackDepth = (depth: number) => {
      posthog.capture("content_scroll_depth", {
        depth,
        title,
        slug,
        category,
      });
    };

    const checkReadComplete = (currentDepth: number) => {
      const timeSpent = (Date.now() - startTime.current) / 1000;
      if (!readCompleteRef.current && currentDepth > 80 && timeSpent > (estimatedReadTime * 0.2)) {
        setReadComplete(true);
        readCompleteRef.current = true;
        posthog.capture("content_read_complete", {
          title,
          slug,
          category,
          time_spent: timeSpent,
        });
      }
    };

    // 2. Scroll Tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent > maxScrollDepth.current) {
        // Track specific depths
        if (scrollPercent >= 25 && maxScrollDepth.current < 25) trackDepth(25);
        if (scrollPercent >= 50 && maxScrollDepth.current < 50) trackDepth(50);
        if (scrollPercent >= 75 && maxScrollDepth.current < 75) trackDepth(75);
        if (scrollPercent >= 90 && maxScrollDepth.current < 90) trackDepth(100);
        
        maxScrollDepth.current = scrollPercent;
        checkReadComplete(scrollPercent);
      }
    };

    // Throttle scroll handler
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 500);
    };

    window.addEventListener("scroll", throttledScroll);

    // 3. Time Spent on Unmount
    return () => {
      window.removeEventListener("scroll", throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
      
      const timeSpent = (Date.now() - startTime.current) / 1000;
      
      // Only track if spent > 2 seconds to avoid bounces
      if (timeSpent > 2 && posthog) {
        posthog.capture("content_time_spent", {
            title,
            slug,
            category,
            seconds: timeSpent,
            max_scroll_depth: maxScrollDepth.current,
        });
      }
    };
  }, [posthog, pathname, title, slug, category, author, labels, publishedDate, estimatedReadTime]); 

  return { readComplete };
}
