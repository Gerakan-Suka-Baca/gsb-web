"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Loader2, ArrowLeft, Building2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { serializeRichText } from "@/components/ui/rich-text";

interface Props {
  programId: string;
}

export const ProgramStudiDetail = ({ programId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: program, isLoading } = useQuery(
    trpc.tryouts.getProgramStudyDetail.queryOptions({ programId })
  );

  // Extract years from history robustly
  const historyYears = useMemo(() => {
    if (!program?.history?.tahun || !Array.isArray(program.history.tahun)) {
      return ["2025"]; // Fallback to current target year
    }
    const years = program.history.tahun.filter((y: any) => y !== null).map(String);
    if (!years.includes("2025")) years.push("2025");
    return years.sort((a: string, b: string) => parseInt(b) - parseInt(a)); // Descending year
  }, [program?.history]);

  const [selectedYear, setSelectedYear] = useState<string>(historyYears[0] || "2025");

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

  // Calculate dynamic stats based on selected year
  let displayApplicants = program.predictedApplicants || "-";
  let displayCapacity = program.capacity || "-";
  let displayPercentage = program.passingPercentage || "-";

  if (selectedYear !== "2025" && program.history) {
    const yearIndex = program.history.tahun?.findIndex((y: any) => String(y) === selectedYear);
    if (yearIndex !== undefined && yearIndex >= 0) {
      const histPendaftar = program.history.peminat?.[yearIndex];
      const histDayaTampung = program.history.daya_tampung?.[yearIndex];
      
      displayApplicants = histPendaftar ?? "-";
      displayCapacity = histDayaTampung ?? "-";
      
      if (histPendaftar && histDayaTampung) {
         displayPercentage = ((histDayaTampung / histPendaftar) * 100).toFixed(1) + "%";
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gsb-tosca font-medium mb-6 flex-wrap gap-2">
         <Link href="/universities" className="hover:underline">Universitas</Link>
         <span>›</span>
         <span className="hover:underline cursor-pointer">{program.university?.name || "Kampus"}</span>
         <span>›</span>
         <span className="text-foreground">{program.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Info & Stat Cards) */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-6 md:p-8 bg-card border-border shadow-sm">
            <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">
              {program.name}
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5" /> 
              {program.university?.name}
            </p>

            {/* University Target Score Pill */}
            <div className="inline-flex items-center gap-4 bg-blue-50 dark:bg-blue-950/30 px-5 py-3 rounded-full border border-blue-100 dark:border-blue-900">
               <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Rekomendasi Target Nilai UTBK</span>
               <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                 {program.passingGrade}
               </span>
            </div>
          </Card>

          {/* Description Section */}
          {(program.description as any)?.root?.children?.length > 0 && (
            <Card className="p-6 md:p-8 bg-card border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4 font-heading text-foreground">Deskripsi</h2>
              <div className="text-muted-foreground leading-relaxed text-[15px]">
                {serializeRichText((program.description as any).root.children)}
              </div>
            </Card>
          )}

          {/* Courses Section */}
          {(program.courses as any)?.root?.children?.length > 0 && (
            <Card className="p-6 md:p-8 bg-card border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4 font-heading text-foreground">Mata Kuliah yang Diriwayatkan</h2>
              <div className="text-muted-foreground leading-relaxed text-[15px]">
                {serializeRichText((program.courses as any).root.children)}
              </div>
            </Card>
          )}

        </div>

        {/* Right Column (Dynamic Stats Dropdown & University Info) */}
        <div className="space-y-6">
          <Card className="p-6 bg-card border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                Peluang UTBK Tahun
              </span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {historyYears.map((year: string) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">Pendaftar</p>
                <p className="font-bold text-lg text-foreground">{displayApplicants}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-900/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">Diterima</p>
                <p className="font-bold text-lg text-foreground">{displayCapacity}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">Peluang</p>
                <p className="font-bold text-lg text-foreground">{displayPercentage}</p>
              </div>
            </div>
            
            {program.avgUkt && program.avgUkt !== "DATA TIDAK TERSEDIA" && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Estimasi Biaya Kuliah</p>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Rata-rata UKT</span>
                    <span className="font-bold">{program.avgUkt}</span>
                  </div>
                  {program.maxUkt && program.maxUkt !== "DATA TIDAK TERSEDIA" && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">UKT Maksimal</span>
                    <span className="font-bold">{program.maxUkt}</span>
                  </div>
                  )}
                </div>
            )}
          </Card>

          {/* Sidebar Kampus Card */}
          <Card className="overflow-hidden border-border bg-card shadow-sm">
             {program.university?.image && (
               <div className="h-32 w-full relative bg-muted">
                 <Image 
                   src={program.university.image} 
                   alt={program.university.name} 
                   fill 
                   className="object-cover"
                 />
               </div>
             )}
             <div className="p-6">
               <h3 className="font-bold text-lg mb-1">{program.university?.name}</h3>
               {program.university?.status && (
                 <span className="inline-block px-2.5 py-1 bg-muted text-muted-foreground text-[11px] font-bold tracking-wider rounded-md uppercase mb-4">
                   PTN {program.university.status}
                 </span>
               )}
               {program.university?.website && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Website Resmi</p>
                    <a href={program.university.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
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
