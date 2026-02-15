"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const TryoutListSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-64 md:w-96" />
        <Skeleton className="h-5 w-full md:w-[500px]" />
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full overflow-x-auto pb-2 md:pb-0 mb-6 md:mb-8 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 border-2 border-border/50 rounded-2xl bg-card/50">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1">
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="flex justify-end mt-2">
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
