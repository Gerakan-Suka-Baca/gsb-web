"use client";

import { use } from "react";
import { UnivRecommendations } from "@/modules/universitas/ui/components/UnivRecommendations";

export default function RecommendationsPage({ params }: { params: Promise<{ tryoutId: string }> }) {
  const unwrappedParams = use(params);
  return (
    <div className="bg-background min-h-screen">
      <UnivRecommendations tryoutId={unwrappedParams.tryoutId} />
    </div>
  );
}
