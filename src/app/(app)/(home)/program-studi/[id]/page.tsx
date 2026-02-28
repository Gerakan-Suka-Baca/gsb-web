"use client";

import { use } from "react";
import { UnivProgramStudiDetail } from "@/modules/universitas/ui/components/UnivProgramStudiDetail";

export default function ProgramStudiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <UnivProgramStudiDetail programId={unwrappedParams.id} />
    </div>
  );
}
