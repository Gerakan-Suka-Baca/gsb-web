"use client";

import { useContentAnalytics, ContentAnalyticsProps } from "@/hooks/useContentAnalytics";

export function ArticleAnalyticsTracker(props: ContentAnalyticsProps) {
  useContentAnalytics(props);
  return null;
}
