"use client";

import { use } from "react";
import { Recommendations } from "@/modules/universitas/ui/components/Recommendations";

export default function RecommendationsPage({ params }: { params: Promise<{ tryoutId: string }> }) {
  const unwrappedParams = use(params);
  return (
    <div className="bg-background min-h-screen">
      <Recommendations tryoutId={unwrappedParams.tryoutId} />
    </div>
  );
}
