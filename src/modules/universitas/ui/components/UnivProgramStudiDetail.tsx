"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { serializeRichText } from "@/components/ui/rich-text";

interface Props {
  programId: string;
}

type ProgramHistory = {
  tahun?: Array<number | string | null>;
  peminat?: Array<number | null>;
  daya_tampung?: Array<number | null>;
};

type ProgramDetail = {
  id?: string;
  name?: string;
  passingGrade?: number;
  predictedApplicants?: number | string;
  capacity?: number | string;
  passingPercentage?: string;
  faculty?: string;
  metrics?: Array<{
    year?: string;
    capacity?: number;
    applicants?: number;
    predictedApplicants?: number;
    passingPercentage?: string;
    admissionMetric?: string;
    avgUkt?: string;
    maxUkt?: string;
  }>;
  history?: ProgramHistory;
  avgUkt?: string;
  maxUkt?: string;
  description?: { root?: { children?: unknown[] } };
  courses?: { root?: { children?: unknown[] } };
  university?: {
    id?: string | null;
    name?: string;
    image?: string | null;
    status?: string;
    accreditation?: string;
    website?: string;
    abbreviation?: string;
  };
};

export const UnivProgramStudiDetail = ({ programId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const cacheKey = `program-detail:${programId}`;
  const readCache = <T,>(key: string): { data: T; ts: number } | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { data: T; ts: number };
      if (!parsed?.data || !parsed.ts) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const cached = readCache<ProgramDetail>(cacheKey);

  const queryOptions = trpc.tryouts.getProgramStudyDetail.queryOptions({ programId });
  const { data, isLoading } = useQuery({
    ...queryOptions,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: cached?.data ?? undefined,
    initialDataUpdatedAt: cached?.ts,
  });
  const program = data as ProgramDetail | undefined;

  const yearEntries = useMemo(() => {
    if (!program) return [];
    const entries = new Map<string, {
      year: string;
      applicants?: number | string | null;
      capacity?: number | string | null;
      passingPercentage?: string | null;
      predictedApplicants?: number | null;
    }>();

    const historyYears = Array.isArray(program.history?.tahun) ? program.history?.tahun : [];
    historyYears.forEach((year, index) => {
      if (year === null || year === undefined) return;
      const y = String(year);
      entries.set(y, {
        year: y,
        applicants: program.history?.peminat?.[index] ?? null,
        capacity: program.history?.daya_tampung?.[index] ?? null,
      });
    });

    (program.metrics ?? []).forEach((metric) => {
      const y = metric.year ? String(metric.year) : "";
      if (!y) return;
      const existing = entries.get(y) ?? { year: y };
      entries.set(y, {
        ...existing,
        applicants: metric.applicants ?? existing.applicants,
        capacity: metric.capacity ?? existing.capacity,
        passingPercentage: metric.passingPercentage ?? existing.passingPercentage,
        predictedApplicants: metric.predictedApplicants ?? existing.predictedApplicants,
      });
    });

    if (entries.size === 0) {
      entries.set("2025", {
        year: "2025",
        applicants: program.predictedApplicants ?? null,
        capacity: program.capacity ?? null,
        passingPercentage: program.passingPercentage ?? null,
      });
    }

    return Array.from(entries.values()).sort((a, b) => Number(b.year) - Number(a.year));
  }, [program]);

  useEffect(() => {
    if (!program || typeof window === "undefined") return;
    window.localStorage.setItem(cacheKey, JSON.stringify({ data: program, ts: Date.now() }));
  }, [cacheKey, program]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-2">Program Studi Tidak Ditemukan</h2>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      <div className="flex items-center text-sm text-gsb-tosca font-medium mb-6 flex-wrap gap-2">
         <Link href="/universitas" className="hover:underline">Universitas</Link>
         <span>›</span>
         {program.university?.id ? (
           <Link href={`/universitas/${program.university.id}`} className="hover:underline">
             {program.university?.name || "Kampus"}
           </Link>
         ) : (
           <span className="hover:underline cursor-pointer">{program.university?.name || "Kampus"}</span>
         )}
         <span>›</span>
         <span className="text-foreground">{program.name}</span>
      </div>

      <div className="flex flex-col space-y-8">
        <div className="space-y-8">
          
          <Card className="p-6 md:p-8 bg-card border-border shadow-sm">
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">
              {program.name}
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5" /> 
              {program.university?.name}
            </p>

            <div className="inline-flex items-center gap-4 bg-blue-50 dark:bg-blue-950/30 px-5 py-3 rounded-full border border-blue-100 dark:border-blue-900">
               <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Rekomendasi Target Nilai UTBK</span>
               <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                 {program.passingGrade && program.passingGrade > 0 ? program.passingGrade : "Tidak ada data"}
               </span>
            </div>
            {program.faculty && (
              <div className="mt-4 text-sm font-semibold text-muted-foreground">
                Fakultas: <span className="text-foreground">{program.faculty}</span>
              </div>
            )}
          </Card>

        {/* Peluang UTBK Section (Moved from Sidebar) */}
        <Card className="p-6 md:p-8 bg-card border-border shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              Peluang UTBK per Tahun
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {yearEntries.map((row) => {
              const applicants = row.applicants ?? "-";
              const capacity = row.capacity ?? "-";
              const percentage =
                typeof row.applicants === "number" &&
                typeof row.capacity === "number" &&
                row.applicants > 0
                  ? `${((row.capacity / row.applicants) * 100).toFixed(1)}%`
                  : row.passingPercentage || "-";
              return (
                <div key={row.year} className="rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow bg-background">
                  <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                    <span className="text-base font-extrabold text-foreground">Tahun {row.year}</span>
                    {row.year === "2025" && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-primary/10 text-primary rounded-full">Terbaru</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-900/50">
                      <p className="text-[10px] uppercase sm:text-xs text-muted-foreground font-semibold mb-1">Pendaftar</p>
                      <p className="font-black text-lg sm:text-xl text-foreground">{applicants}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-900/50">
                      <p className="text-[10px] uppercase sm:text-xs text-muted-foreground font-semibold mb-1">Diterima</p>
                      <p className="font-black text-lg sm:text-xl text-foreground">{capacity}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900/50">
                      <p className="text-[10px] uppercase sm:text-xs text-muted-foreground font-semibold mb-1">Peluang</p>
                      <p className="font-black text-lg sm:text-xl text-foreground">{percentage}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {program.avgUkt && program.avgUkt !== "DATA TIDAK TERSEDIA" && (
              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl">
                <div>
                  <p className="text-sm text-foreground font-bold uppercase tracking-wider mb-1">Estimasi Biaya Kuliah (UKT)</p>
                  <p className="text-xs text-muted-foreground">Berdasarkan data rata-rata dan nilai maksimal golongan tertinggi.</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Rata-rata</span>
                    <span className="font-black text-lg text-gsb-tosca">{program.avgUkt}</span>
                  </div>
                  {program.maxUkt && program.maxUkt !== "DATA TIDAK TERSEDIA" && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Maksimal</span>
                      <span className="font-black text-lg text-gsb-orange">{program.maxUkt}</span>
                    </div>
                  )}
                </div>
              </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.isArray(program.description?.root?.children) && program.description.root.children.length > 0 && (
            <Card className="p-6 md:p-8 bg-card border-border shadow-sm h-full">
              <h2 className="text-xl font-bold mb-4 font-heading text-foreground border-b border-border pb-4">Deskripsi Program Studi</h2>
              <div className="text-muted-foreground leading-relaxed text-[15px] prose prose-slate dark:prose-invert">
                {serializeRichText(program.description.root.children as Parameters<typeof serializeRichText>[0])}
              </div>
            </Card>
          )}

          {Array.isArray(program.courses?.root?.children) && program.courses.root.children.length > 0 && (
            <Card className="p-6 md:p-8 bg-card border-border shadow-sm h-full">
              <h2 className="text-xl font-bold mb-4 font-heading text-foreground border-b border-border pb-4">Mata Kuliah yang Diriwayatkan</h2>
              <div className="text-muted-foreground leading-relaxed text-[15px] prose prose-slate dark:prose-invert">
                {serializeRichText(program.courses.root.children as Parameters<typeof serializeRichText>[0])}
              </div>
            </Card>
          )}
        </div>

          <Card className="overflow-hidden border-border bg-card shadow-sm flex flex-col md:flex-row items-center gap-6 p-6">
             {program.university?.image && (
               <div className="h-24 w-24 md:h-32 md:w-32 relative bg-white dark:bg-slate-800 rounded-xl p-2 shrink-0 border border-border shadow-sm">
                 <Image 
                   src={program.university.image as string} 
                   alt={program.university.name || "Kampus"} 
                   fill 
                   className="object-contain p-2"
                 />
               </div>
             )}
             <div className="flex-1 text-center md:text-left">
               <h3 className="font-bold text-2xl mb-2 font-heading text-foreground">{program.university?.name}</h3>
               {program.university?.status && (
                 <span className="inline-flex px-3 py-1 bg-primary/10 text-primary text-xs font-bold tracking-wider rounded-md uppercase mb-4">
                   PTN {program.university.status}
                 </span>
               )}
               {program.university?.website && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground font-medium mr-2 block sm:inline">Website Resmi:</span>
                    <a href={program.university.website} target="_blank" rel="noopener noreferrer" className="font-bold text-gsb-blue hover:underline">
                      {program.university.website.replace("https://", "").replace("http://", "")}
                    </a>
                  </div>
               )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
