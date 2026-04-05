"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, RefreshCw, BarChart4, Filter, Search, UserCircle2, GraduationCap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Bar,
} from "recharts";

export const MentorDashboardView = () => {
  const trpc = useTRPC();
  const [searchTerm, setSearchTerm] = useState("");
  const [tryoutFilter, setTryoutFilter] = useState<string>("ALL");
  const [passingFilter, setPassingFilter] = useState<string>("ALL");
  
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const queryOptions = trpc.mentor.getDashboardData.queryOptions({});
  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...queryOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = [
      "Nama Siswa",
      "Email",
      "WhatsApp",
      "Asal Sekolah",
      "Tryout",
      "Nilai PU",
      "Nilai PK",
      "Nilai PM",
      "Nilai LBE",
      "Nilai LBI",
      "Nilai PPU",
      "Nilai KMBM",
      "SKOR AKHIR",
      "Target PTN 1",
      "Target Jurusan 1",
      "Peluang Pilihan 1",
      "Peluang % Pilihan 1",
      "Target PTN 2",
      "Target Jurusan 2",
      "Peluang Pilihan 2",
      "Peluang % Pilihan 2",
      "Target PTN 3",
      "Target Jurusan 3",
      "Peluang Pilihan 3",
      "Peluang % Pilihan 3",
      "Alternatif 1",
      "Alternatif 2",
      "Alternatif 3",
      "Alternatif 4",
      "Alternatif 5",
    ];

    const rows = data.map((d) => {
      const u = d.user;
      const s = d.scoreDetails;
      const a = d.analysis;

      return [
        `"${u.fullName}"`,
        `"${u.email}"`,
        `"${u.whatsapp}"`,
        `"${u.schoolOrigin}"`,
        `"${d.tryout.title}"`,
        s.score_PU,
        s.score_PK,
        s.score_PM,
        s.score_LBE,
        s.score_LBI,
        s.score_PPU,
        s.score_KMBM,
        s.finalScore,
        `"${a.choice1.dbUnivName || a.choice1.targetPTN}"`,
        `"${a.choice1.dbMajorName || a.choice1.targetMajor}"`,
        `"${a.choice1.level}"`,
        a.choice1.chance,
        `"${a.choice2.dbUnivName || a.choice2.targetPTN}"`,
        `"${a.choice2.dbMajorName || a.choice2.targetMajor}"`,
        `"${a.choice2.level}"`,
        a.choice2.chance,
        `"${a.choice3.dbUnivName || a.choice3.targetPTN}"`,
        `"${a.choice3.dbMajorName || a.choice3.targetMajor}"`,
        `"${a.choice3.level}"`,
        a.choice3.chance,
        ...[0,1,2,3,4].map(idx => {
          const alt = a.alternatives[idx];
          if (!alt) return '""';
          return `"${alt.universityName} - ${alt.name} (${alt.chance}%)"`;
        })
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mentor_dashboard_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeColor = (level?: string) => {
    switch (level) {
      case "Sangat Aman":
      case "Aman":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "Kompetitif":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "Risiko":
      case "Sangat Sulit":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "bg-slate-200 text-slate-700 hover:bg-slate-300";
    }
  };

  // Get unique tryouts for filter
  const availableTryouts = Array.from(new Set(data?.map(d => d.tryout.title) || []));

  const filteredData = data?.filter(row => {
     const matchSearch = row.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         row.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.tryout.title.toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchTryout = tryoutFilter === "ALL" || row.tryout.title === tryoutFilter;
     
     let matchPassing = true;
     if (passingFilter !== "ALL") {
        const isSafe = row.analysis.choice1.level === "Aman" || row.analysis.choice1.level === "Sangat Aman";
        const isCompetitive = row.analysis.choice1.level === "Kompetitif";
        const isRisk = row.analysis.choice1.level === "Risiko" || row.analysis.choice1.level === "Sangat Sulit";
        
        if (passingFilter === "SAFE" && !isSafe) matchPassing = false;
        if (passingFilter === "COMPETITIVE" && !isCompetitive) matchPassing = false;
        if (passingFilter === "RISK" && !isRisk) matchPassing = false;
     }

     return matchSearch && matchTryout && matchPassing;
  });

  const openStudentModal = (studentData: any) => {
     setSelectedStudent(studentData);
     setIsModalOpen(true);
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2.5 bg-primary/10 rounded-xl">
               <BarChart4 className="w-8 h-8 text-primary" />
             </div>
             <div>
               <h1 className="text-3xl font-bold font-heading tracking-tight">Mentor Intelligence</h1>
               <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                  Sistem Real-time Tersambung
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-auto">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isRefetching}
            className="flex-1 md:flex-none border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-11"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Sinkronisasi Data
          </Button>
          <Button onClick={exportToCSV} className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-11 shadow-md shadow-primary/20">
            <Download className="w-4 h-4 mr-2" />
            Eksplor CSV Rinci
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border bg-white shadow-sm overflow-visible">
         <div className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-1/3">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                  placeholder="Telusuri siswa, email, sekolah..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11 bg-accent/30 border-transparent focus:border-primary/30 transition-all rounded-xl"
               />
            </div>
            
            <div className="flex w-full lg:w-auto items-center gap-3 flex-wrap sm:flex-nowrap">
               <div className="flex items-center gap-2 w-full sm:w-auto text-sm font-medium">
                  <Filter className="w-4 h-4 text-muted-foreground" /> Tryout:
               </div>
               <Select value={tryoutFilter} onValueChange={setTryoutFilter}>
                 <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-xl bg-accent/30 border-transparent">
                   <SelectValue placeholder="Semua Tryout" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL">Semua Paket Tryout</SelectItem>
                   {availableTryouts.map((title, i) => (
                      <SelectItem key={i} value={title}>{title}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <div className="h-6 w-px bg-border hidden sm:block"></div>

               <Select value={passingFilter} onValueChange={setPassingFilter}>
                 <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-accent/30 border-transparent">
                   <SelectValue placeholder="Status Kelulusan Pilihan 1" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL">Semua Peluang</SelectItem>
                   <SelectItem value="SAFE">✅ Area Aman</SelectItem>
                   <SelectItem value="COMPETITIVE">⚠️ Area Kompetitif</SelectItem>
                   <SelectItem value="RISK">❌ Area Risiko Tinggi</SelectItem>
                 </SelectContent>
               </Select>
            </div>
         </div>
      </Card>

      {/* Main Data Table */}
      <Card className="overflow-hidden border-border bg-white shadow-md rounded-2xl">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="relative">
               <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
               <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
            </div>
            <p className="mt-6 text-muted-foreground font-medium animate-pulse">Memuat Data Siswa dan Analisis Cerdas...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-accent/50 rounded-full flex items-center justify-center mb-4">
               <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-heading text-foreground mb-2">Belum Tersedia Data Rekaman</h3>
            <p className="text-muted-foreground max-w-md">Tidak ada satupun rekor tryout yang terekam pada sesi yang Anda miliki. Harap pastikan peserta telah mengeklaim sesi Ujian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full custom-scrollbar">
            <Table className="w-full text-sm">
              <TableHeader className="bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10">
                <TableRow className="border-b-2 border-border/80">
                  <TableHead className="w-[280px] font-bold text-slate-700 py-5">Identitas & Riwayat Ujian</TableHead>
                  <TableHead className="text-center w-[120px] font-bold text-slate-700 py-5 border-l border-border/40">Skor Akhir</TableHead>
                  <TableHead className="min-w-[280px] border-l border-border/40 font-bold text-slate-700 py-5">Target Impian 1 (Prioritas Utama)</TableHead>
                  <TableHead className="min-w-[280px] border-l border-border/40 font-bold text-slate-700 py-5">Target Impian 2 (Pilihan Kedua)</TableHead>
                  <TableHead className="min-w-[320px] border-l border-border/40 font-bold text-slate-700 py-5">Alternatif Otomatis (Aman) - Top 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData?.length === 0 ? (
                   <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">Tidak ditemukan siswa yang cocok dengan filter yang ditetapkan.</TableCell>
                   </TableRow>
                ) : (
                filteredData?.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50 border-b border-border/50 group transition-colors">
                    <TableCell className="p-4 align-top">
                       <button 
                          onClick={() => openStudentModal(row)}
                          className="text-left w-full hover:bg-primary/5 p-2 -ml-2 rounded-xl transition-all group-hover:border-primary/20 border border-transparent flex gap-3 items-start"
                          title="Klik untuk membuka Profil Rinci Siswa"
                       >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                             <UserCircle2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                             <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{row.user.fullName}</p>
                             <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{row.user.email}</span>
                             </div>
                             <div className="mt-2 text-xs font-semibold px-2 py-1 bg-accent/50 rounded-md truncate max-w-[200px] border border-border/50">
                                {row.tryout.title}
                             </div>
                          </div>
                       </button>
                    </TableCell>
                    
                    <TableCell className="text-center border-l border-border/30 align-top p-4">
                      <div className="flex flex-col items-center justify-center">
                         <div className="inline-flex items-center justify-center p-2 rounded-2xl border-4 shadow-sm w-20 h-20 bg-white" style={{ borderColor: row.scoreDetails.finalScore >= 600 ? '#22c55e' : (row.scoreDetails.finalScore >= 450 ? '#f59e0b' : '#ef4444') }}>
                            <span className="text-xl font-black tracking-tighter" style={{ color: row.scoreDetails.finalScore >= 600 ? '#16a34a' : (row.scoreDetails.finalScore >= 450 ? '#d97706' : '#dc2626') }}>
                               {Math.round(row.scoreDetails.finalScore)}
                            </span>
                         </div>
                         <span className="text-[10px] font-medium text-muted-foreground mt-2 bg-accent px-2 py-0.5 rounded-full uppercase tracking-wider">UTBK 2026</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="border-l border-border/30 align-top p-4 bg-slate-50/30">
                       {row.analysis.choice1.found ? (
                          <div className="space-y-3">
                             <div>
                                <p className="font-bold text-sm text-foreground line-clamp-2 leading-tight">{row.analysis.choice1.dbMajorName}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/> {row.analysis.choice1.dbUnivName}</p>
                             </div>
                             <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-border shadow-sm">
                                <Badge className={`${getBadgeColor(row.analysis.choice1.level)} px-2.5 py-1 text-xs border-none`}>
                                  {row.analysis.choice1.level}
                                </Badge>
                                <span className="text-sm font-black flex-1 text-right">{row.analysis.choice1.chance}%</span>
                             </div>
                             <div className="flex justify-between items-center text-[11px] text-muted-foreground px-1">
                                <span>Passing Grade Ideal</span>
                                <span className="font-bold">{row.analysis.choice1.passingGrade}</span>
                             </div>
                          </div>
                       ) : (
                          <div className="h-full flex items-center justify-center opacity-50 p-6 border-2 border-dashed border-border rounded-xl">
                             <div className="text-center text-xs italic">Target Jurusan 1<br/>Tidak Ditetapkan</div>
                          </div>
                       )}
                    </TableCell>

                    <TableCell className="border-l border-border/30 align-top p-4 bg-slate-50/30">
                       {row.analysis.choice2.found ? (
                          <div className="space-y-3">
                             <div>
                                <p className="font-bold text-sm text-foreground line-clamp-2 leading-tight">{row.analysis.choice2.dbMajorName}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/> {row.analysis.choice2.dbUnivName}</p>
                             </div>
                             <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-border shadow-sm">
                                <Badge className={`${getBadgeColor(row.analysis.choice2.level)} px-2.5 py-1 text-xs border-none`}>
                                  {row.analysis.choice2.level}
                                </Badge>
                                <span className="text-sm font-black flex-1 text-right">{row.analysis.choice2.chance}%</span>
                             </div>
                             <div className="flex justify-between items-center text-[11px] text-muted-foreground px-1">
                                <span>Passing Grade Ideal</span>
                                <span className="font-bold">{row.analysis.choice2.passingGrade}</span>
                             </div>
                          </div>
                       ) : (
                          <div className="h-full flex items-center justify-center opacity-50 p-6 border-2 border-dashed border-border rounded-xl">
                             <div className="text-center text-xs italic">Target Jurusan 2<br/>Tidak Ditetapkan</div>
                          </div>
                       )}
                    </TableCell>

                    <TableCell className="border-l border-border/30 align-top p-4">
                       {row.analysis.alternatives.length > 0 ? (
                          <div className="space-y-2.5">
                             {row.analysis.alternatives.slice(0,3).map((alt: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs bg-accent/40 hover:bg-accent/80 transition-colors px-3 py-2.5 rounded-xl border border-border group/alt">
                                   <div className="flex-1 min-w-0 pr-3">
                                      <p className="font-bold text-slate-800 truncate" title={alt.name}>{alt.name}</p>
                                      <p className="text-muted-foreground truncate text-[10px] uppercase font-medium mt-0.5" title={alt.universityName}>{alt.universityName}</p>
                                   </div>
                                   <div className="flex flex-col items-end shrink-0">
                                      <span className="font-black text-green-600 text-sm">{alt.chance}%</span>
                                      <span className="text-[9px] text-green-600/70 font-bold uppercase tracking-wider">Aman</span>
                                   </div>
                                </div>
                             ))}
                             {row.analysis.alternatives.length > 3 && (
                                <div className="text-[10px] text-center text-muted-foreground font-medium pt-1">
                                   + {row.analysis.alternatives.length - 3} Opsi Tersedia di CSV Export
                                </div>
                             )}
                          </div>
                       ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-60 p-6 bg-accent/20 rounded-xl">
                             <GraduationCap className="w-6 h-6 text-muted-foreground mb-2" />
                             <div className="text-center text-xs">Alternatif aman tidak ditemukan.<br/>Skor Akhir mungkin terlalu rendah.</div>
                          </div>
                       )}
                    </TableCell>

                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Fullscreen Student Profile Overlay */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           {/* Close bar */}
           <div className="absolute top-4 right-4 z-[110] flex items-center gap-3">
              <span className="text-white/70 text-sm font-medium hidden md:block">Tekan ESC atau klik untuk menutup</span>
              <button
                 onClick={() => setIsModalOpen(false)}
                 className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
              >
                 <span className="text-xl leading-none">&times;</span>
              </button>
           </div>

           {/* Overlay click to close */}
           <button className="absolute inset-0 z-[99] cursor-default" onClick={() => setIsModalOpen(false)} aria-label="Close modal" />

           {/* Modal body */}
           <div className="relative z-[100] w-full h-full md:m-auto md:w-[95vw] md:max-w-6xl md:h-[92vh] md:rounded-2xl overflow-hidden bg-background shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
              
              {/* Sidebar Left - Student Identity */}
              <div className="w-full md:w-[300px] lg:w-[340px] bg-white md:border-r border-b md:border-b-0 border-border shrink-0 p-6 md:p-8 flex flex-col items-center text-center md:overflow-y-auto">
                 <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-1 mb-4 shadow-xl shrink-0">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                       <UserCircle2 className="w-full h-full text-slate-200" />
                    </div>
                 </div>
                 <h2 className="text-xl md:text-2xl font-bold font-heading mb-1">{selectedStudent.user.fullName}</h2>
                 <p className="text-sm font-medium text-muted-foreground mb-6">{selectedStudent.user.schoolOrigin || "Asal Sekolah Tidak Diketahui"}</p>
                 
                 <div className="w-full space-y-3 text-left">
                    <div className="bg-accent/40 p-3 rounded-xl">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Kontak Email</p>
                       <p className="text-sm font-medium break-all">{selectedStudent.user.email}</p>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-xl">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">WhatsApp / No. HP</p>
                       <p className="text-sm font-medium">{selectedStudent.user.whatsapp || "-"}</p>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-xl">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Asal Sekolah</p>
                       <p className="text-sm font-medium">{selectedStudent.user.schoolOrigin || "-"}</p>
                    </div>

                    {/* Big Score in Sidebar */}
                    <div className="bg-primary/5 border-2 border-primary/20 p-5 rounded-2xl text-center mt-4">
                       <p className="text-xs uppercase font-bold text-primary mb-1">Skor Akhir UTBK</p>
                       <p className="text-5xl font-black text-primary font-heading">{Math.round(selectedStudent.scoreDetails?.finalScore || 0)}</p>
                    </div>
                 </div>
              </div>

              {/* Main Content - Scrollable Analytics */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-slate-50">
                 <div className="mb-6">
                   <div className="flex items-center gap-2 text-primary mb-1">
                      <BarChart4 className="w-5 h-5"/>
                      <span className="text-sm font-bold uppercase tracking-wider">Laporan Skor Peserta</span>
                   </div>
                   <h2 className="text-2xl md:text-3xl font-heading font-bold">Diagnosis Kemampuan Siswa</h2>
                   <p className="text-muted-foreground text-sm mt-1">
                     Berdasarkan Tryout: <strong className="text-foreground">{selectedStudent.tryout?.title}</strong>
                   </p>
                 </div>

                 <div className="space-y-6">
                    {/* 7 Subtests Grid */}
                    <div className="bg-white rounded-2xl p-5 md:p-6 border border-border shadow-sm">
                       <h3 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                          <span className="w-2 h-6 bg-gsb-orange rounded-full"></span> Rincian 7 Subtes Skolastik
                       </h3>
                       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                          {[
                             { title: "PU", fullName: "Penalaran Umum", val: selectedStudent.scoreDetails?.score_PU },
                             { title: "PK", fullName: "Pengetahuan Kuantitatif", val: selectedStudent.scoreDetails?.score_PK },
                             { title: "PM", fullName: "Penalaran Matematika", val: selectedStudent.scoreDetails?.score_PM },
                             { title: "LBE", fullName: "Literasi Bahasa Inggris", val: selectedStudent.scoreDetails?.score_LBE },
                             { title: "LBI", fullName: "Literasi Bahasa Indonesia", val: selectedStudent.scoreDetails?.score_LBI },
                             { title: "PPU", fullName: "Pengetahuan Pemahaman Umum", val: selectedStudent.scoreDetails?.score_PPU },
                             { title: "KMBM", fullName: "Kemampuan Memahami Bacaan & Menulis", val: selectedStudent.scoreDetails?.score_KMBM },
                          ].map((st, i) => {
                             const score = Math.round(st.val || 0);
                             const pct = Math.min((score / 1000) * 100, 100);
                             const color = score >= 700 ? "text-green-600" : score >= 500 ? "text-amber-600" : "text-red-600";
                             const barColor = score >= 700 ? "bg-green-500" : score >= 500 ? "bg-amber-500" : "bg-red-500";
                             return (
                                <div key={i} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col items-center text-center group hover:border-primary/30 hover:shadow-sm transition-all" title={st.fullName}>
                                   <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 truncate w-full">{st.title}</p>
                                   <p className={`text-xl font-black ${color}`}>{score}</p>
                                   <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                   </div>
                                   <p className="text-[9px] text-muted-foreground mt-1 line-clamp-1">{st.fullName}</p>
                                </div>
                             );
                          })}
                       </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-white rounded-2xl p-5 md:p-6 border border-border shadow-sm">
                       <h3 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                          <span className="w-2 h-6 bg-primary rounded-full"></span> Persebaran Kemampuan Skolastik
                       </h3>
                       <div className="h-[280px] md:h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                               { subject: 'PU', score: selectedStudent.scoreDetails?.score_PU || 0 },
                               { subject: 'PK', score: selectedStudent.scoreDetails?.score_PK || 0 },
                               { subject: 'PM', score: selectedStudent.scoreDetails?.score_PM || 0 },
                               { subject: 'LBE', score: selectedStudent.scoreDetails?.score_LBE || 0 },
                               { subject: 'LBI', score: selectedStudent.scoreDetails?.score_LBI || 0 },
                               { subject: 'PPU', score: selectedStudent.scoreDetails?.score_PPU || 0 },
                               { subject: 'KMBM', score: selectedStudent.scoreDetails?.score_KMBM || 0 },
                            ]}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 1000]} tick={false} axisLine={false} />
                              <Radar name="Skor" dataKey="score" stroke="#ea580c" fill="#f97316" fillOpacity={0.35} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* University Projections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Choice 1 */}
                       <div className="bg-slate-900 rounded-2xl p-5 md:p-6 shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <GraduationCap className="w-20 h-20 text-white" />
                          </div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-2 relative z-10">Target Universitas 1</p>
                          
                          <div className="relative z-10 space-y-4">
                             <div>
                                <p className="text-white font-bold text-lg leading-tight">{selectedStudent.analysis?.choice1?.dbMajorName || "Belum Ditetapkan"}</p>
                                <p className="text-slate-400 text-sm mt-1">{selectedStudent.analysis?.choice1?.dbUnivName || "-"}</p>
                             </div>
                             
                             <div className="bg-white/10 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                                <div>
                                   <p className="text-slate-400 text-[10px] uppercase font-bold">Peluang Lolos</p>
                                   <p className="text-green-400 font-bold text-3xl font-heading">{selectedStudent.analysis?.choice1?.chance || 0}%</p>
                                </div>
                                <Badge className={`${selectedStudent.analysis?.choice1?.level === 'Aman' || selectedStudent.analysis?.choice1?.level === 'Sangat Aman' ? 'bg-green-500' : selectedStudent.analysis?.choice1?.level === 'Kompetitif' ? 'bg-amber-500' : 'bg-red-500'} text-white text-xs px-3 py-1`}>
                                   {selectedStudent.analysis?.choice1?.level || "N/A"}
                                </Badge>
                             </div>
                             <div className="flex justify-between text-xs text-slate-400">
                                <span>Passing Grade</span>
                                <span className="font-bold text-white">{selectedStudent.analysis?.choice1?.passingGrade || "-"}</span>
                             </div>
                          </div>
                       </div>

                       {/* Choice 2 */}
                       <div className="bg-white border border-border shadow-sm rounded-2xl p-5 md:p-6 relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                             <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Target Universitas 2</p>
                             <Badge variant="outline" className={`text-xs ${selectedStudent.analysis?.choice2?.level === 'Aman' || selectedStudent.analysis?.choice2?.level === 'Sangat Aman' ? 'border-green-500 text-green-600' : 'border-slate-300 text-slate-600'}`}>
                                {selectedStudent.analysis?.choice2?.level || "N/A"}
                             </Badge>
                          </div>
                          <div className="space-y-4">
                             <div>
                                <p className="text-slate-800 font-bold text-lg leading-tight">{selectedStudent.analysis?.choice2?.dbMajorName || "Belum Ditetapkan"}</p>
                                <p className="text-slate-500 text-sm mt-1">{selectedStudent.analysis?.choice2?.dbUnivName || "-"}</p>
                             </div>
                             <div className="flex items-center w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${selectedStudent.analysis?.choice2?.chance || 0}%` }}></div>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Passing Grade: <strong>{selectedStudent.analysis?.choice2?.passingGrade || "-"}</strong></span>
                                <span className="font-black text-primary">{selectedStudent.analysis?.choice2?.chance || 0}%</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Top 5 Alternatives */}
                    {selectedStudent.analysis?.alternatives?.length > 0 && (
                       <div className="bg-white rounded-2xl p-5 md:p-6 border border-border shadow-sm">
                          <h3 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                             <span className="w-2 h-6 bg-green-500 rounded-full"></span> Alternatif Aman (Top {Math.min(selectedStudent.analysis.alternatives.length, 5)})
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                             {selectedStudent.analysis.alternatives.slice(0, 5).map((alt: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 hover:border-green-400 rounded-xl p-4 transition-colors group">
                                   <div className="min-w-0 flex-1 pr-3">
                                      <p className="font-bold text-sm text-slate-800 truncate" title={alt.name}>{alt.name}</p>
                                      <p className="text-xs text-slate-500 truncate mt-0.5" title={alt.universityName}>{alt.universityName}</p>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <p className="text-lg font-black text-green-600">{alt.chance}%</p>
                                      <p className="text-[9px] text-green-500 font-bold uppercase">Aman</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
