"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card } from "@/components/ui/card";
import { AlertCircle, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

interface Props {
  tryoutId: string;
}

type TargetChoice = {
  found?: boolean;
  targetPTN?: string | null;
  targetMajor?: string | null;
  dbUnivName?: string;
  dbMajorName?: string;
  level?: string;
  chance?: number;
  color?: string;
  programId?: string | null;
  universityId?: string | null;
};

type TargetAnalysisResponse = {
  finalScore: number;
  choice1: TargetChoice;
  choice2: TargetChoice;
  choice3: TargetChoice;
} | null;

export const AdmissionAnalysis = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const cacheKey = `admission-analysis:${tryoutId}`;
  const readCache = (key: string): { data: TargetAnalysisResponse; ts: number } | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { data: TargetAnalysisResponse; ts: number };
      if (!parsed?.data || !parsed.ts) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const cached = readCache(cacheKey);
  const queryOptions = trpc.tryouts.getTargetAnalysis.queryOptions({ tryoutId });
  const { data, isLoading } = useQuery({
    ...queryOptions,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: cached?.data ?? undefined,
    initialDataUpdatedAt: cached?.ts,
  });

  useEffect(() => {
    if (!data || typeof window === "undefined") return;
    window.localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  }, [cacheKey, data]);

  if (isLoading) {
    return (
      <Card className="p-6 mb-8 mt-4 animate-pulse bg-muted/50 border-none shadow-sm">
        <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
        <div className="flex gap-4">
          <div className="h-28 w-1/2 bg-muted rounded"></div>
          <div className="h-28 w-1/2 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const result = data as TargetAnalysisResponse;
  if (!result) return null;

  const renderChoice = (choice: TargetChoice, title: string) => {
    if (!choice.targetPTN || !choice.targetMajor) {
      return (
        <Card className="p-5 border-dashed border-2 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
          <Target className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground leading-snug">Target {title} belum diatur atau kosong.</p>
        </Card>
      );
    }

    if (!choice.found) {
      return (
        <Card className="p-5 border border-border h-full min-h-[160px] flex flex-col justify-center bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>
          </div>
          <p className="font-bold text-lg leading-tight mb-1 line-clamp-2">{choice.targetMajor}</p>
          <p className="text-sm text-foreground/70 mb-4 line-clamp-1">{choice.targetPTN}</p>
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 px-3 py-2.5 rounded-lg text-xs font-semibold w-full">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Maaf, kami tidak memiliki data untuk program Anda. Cek rekomendasi universitas lainnya yang sesuai dengan kriteria Anda di bawah ini.</span>
            </div>
          </div>
        </Card>
      );
    }

    const { dbUnivName, dbMajorName, level, color } = choice;
    const chance = choice.chance ?? 0;

    const colorClasses: Record<string, { bg: string, text: string, bar: string, ring: string }> = {
      green: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", bar: "bg-green-500 dark:bg-green-400", ring: "ring-green-500/20" },
      yellow: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500 dark:bg-amber-400", ring: "ring-amber-500/20" },
      red: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500 dark:bg-rose-400", ring: "ring-rose-500/20" }
    };
    
    const cc = (color && colorClasses[color]) || colorClasses.yellow;

    const programLink = choice.programId ? `/program-studi/${choice.programId}` : null;
    const universityLink = choice.universityId ? `/universitas/${choice.universityId}` : null;

    return (
      <Card className={`p-5 h-full min-h-[160px] border border-border shadow-sm hover:shadow-md transition-shadow duration-200 bg-card relative overflow-hidden flex flex-col`}>
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              {title}
            </h3>
            {programLink ? (
              <Link href={programLink} className="block font-bold text-base md:text-lg leading-tight truncate hover:underline" title={dbMajorName}>
                {dbMajorName}
              </Link>
            ) : (
              <p className="block font-bold text-base md:text-lg leading-tight truncate" title={dbMajorName}>{dbMajorName}</p>
            )}
            {universityLink ? (
              <Link href={universityLink} className="block text-sm text-foreground/70 mt-1 truncate hover:underline" title={dbUnivName}>
                {dbUnivName}
              </Link>
            ) : (
              <p className="block text-sm text-foreground/70 mt-1 truncate" title={dbUnivName}>{dbUnivName}</p>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0 bg-muted/50 rounded-lg px-3 py-1.5">
            <span className={`text-2xl font-black tracking-tight ${cc.text}`}>{chance}%</span>
            <span className="text-[9px] uppercase font-bold text-muted-foreground">Peluang Lulus</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-xs mb-2 font-semibold">
            <span className={`${cc.text} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cc.bar}`}></span>
              {level}
            </span>
          </div>
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${cc.bar}`} 
              style={{ width: `${Math.min(chance, 100)}%` }} 
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mb-10 w-full px-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Analisis Kesempatan Lulus</h2>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 mb-5">
        <div className="w-full">
          {renderChoice(result.choice1, "Pilihan 1")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderChoice(result.choice2, "Pilihan 2")}
          {renderChoice(result.choice3, "Pilihan 3")}
        </div>
      </div>
      
      <div className="w-full">
        <Button 
          onClick={() => router.push(`/tryout/${tryoutId}/recommendations`)}
          variant="secondary" 
          className="w-full bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 font-semibold h-12"
        >
          Lihat Rekomendasi Universitas Lainnya
        </Button>
      </div>
    </div>
  );
};
