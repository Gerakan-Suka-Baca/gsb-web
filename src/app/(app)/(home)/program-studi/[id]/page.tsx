"use client";

import { use } from "react";
import { ProgramStudiDetail } from "@/modules/universitas/ui/components/ProgramStudiDetail";

export default function ProgramStudiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <ProgramStudiDetail programId={unwrappedParams.id} />
    </div>
  );
}
