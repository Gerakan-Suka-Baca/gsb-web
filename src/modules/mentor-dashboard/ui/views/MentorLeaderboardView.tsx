"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState } from "react";
import { Loader2, Trophy, BarChart3, Download, ListFilter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

const SORT_OPTIONS = [
  { value: "finalScore", label: "Skor Global (UTBK)" },
  { value: "score_PU", label: "Penalaran Umum (PU)" },
  { value: "score_PK", label: "Pengetahuan Kuantitatif (PK)" },
  { value: "score_PM", label: "Penalaran Matematika (PM)" },
  { value: "score_LBE", label: "Literasi B. Inggris (LBE)" },
  { value: "score_LBI", label: "Literasi B. Indonesia (LBI)" },
  { value: "score_PPU", label: "Pengetahuan Pemahaman (PPU)" },
  { value: "score_KMBM", label: "Kemampuan Baca (KMBM)" },
];

export const MentorLeaderboardView = () => {
  const trpc = useTRPC();
  const [tryoutFilter, setTryoutFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("finalScore");
  const [limit, setLimit] = useState<number>(50);

  const queryOptions = trpc.mentor.getDashboardData.queryOptions({});
  const { data, isLoading, isError } = useQuery(queryOptions);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gsb-orange/80 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="font-bold">Memuat data klasemen...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-destructive">
        <p className="border border-destructive/30 bg-destructive/10 p-4 rounded-lg flex items-center gap-3 font-semibold">
           <span className="text-2xl">⚠️</span> Gagal mengambil data klasemen.
        </p>
      </div>
    );
  }

  const availableTryouts = Array.from(new Set(data.map(d => d.tryout.title)));

  const filteredData = data.filter(row => tryoutFilter === "ALL" || row.tryout.title === tryoutFilter);
  
  filteredData.sort((a, b) => {
     const scoreA = (a.scoreDetails[sortBy as keyof typeof a.scoreDetails] as number) || 0;
     const scoreB = (b.scoreDetails[sortBy as keyof typeof b.scoreDetails] as number) || 0;
     return scoreB - scoreA;
  });

  const displayedData = filteredData.slice(0, limit);

  const exportLeaderboard = () => {
    const headers = ["Peringkat", "Nama Siswa", "Asal Sekolah", "Paket Tryout", "Skor Peringkat (" + SORT_OPTIONS.find(o => o.value === sortBy)?.label + ")"];
    const rows = displayedData.map((row, idx) => {
      return [
        idx + 1,
        `"${row.user.fullName}"`,
        `"${row.user.schoolOrigin || "-"}"`,
        `"${row.tryout.title}"`,
        row.scoreDetails[sortBy as keyof typeof row.scoreDetails]
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leaderboard_${sortBy}_top${limit}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div 
         initial={{ y: -20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         className="bg-card rounded-3xl p-6 md:p-8 border border-gsb-orange/20 shadow-sm relative overflow-hidden"
      >
         <div className="absolute -right-20 -top-20 w-64 h-64 bg-gsb-orange/5 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gsb-yellow/5 rounded-full blur-3xl pointer-events-none" />
         
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
               <motion.div whileHover={{ rotate: 10, scale: 1.05 }} className="p-4 bg-gsb-orange/10 rounded-2xl border border-gsb-orange/20">
                  <BarChart3 className="w-8 h-8 text-gsb-orange" />
               </motion.div>
               <div>
                  <h1 className="text-3xl font-black tracking-tight font-heading text-foreground">Leaderboard Peringkat Nasional</h1>
                  <p className="text-muted-foreground font-medium mt-1">Pantau peringkat siswa secara real-time pada berbagai paket tryout.</p>
               </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
               <Button onClick={exportLeaderboard} className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold gap-2 rounded-xl h-11 shadow-md shadow-gsb-orange/20">
                  <Download className="w-4 h-4" /> Export CSV Peringkat
               </Button>
            </motion.div>
         </div>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
         <Card className="border-border shadow-sm bg-card rounded-3xl overflow-hidden hover:border-gsb-orange/30 transition-colors">
            <div className="p-4 md:p-5 flex flex-col xl:flex-row gap-4 items-center justify-between">
               <div className="flex items-center gap-3 w-full xl:w-auto">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap bg-accent/50 p-2.5 rounded-xl">
                     <ListFilter className="w-4 h-4 text-gsb-orange" /> Filter Preset:
                  </div>
                  <Select value={tryoutFilter} onValueChange={setTryoutFilter}>
                     <SelectTrigger className="w-[240px] h-11 bg-background hover:bg-accent/50 rounded-xl border border-border font-medium focus:ring-gsb-orange">
                        <SelectValue placeholder="Semua Paket Tryout" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl">
                        <SelectItem value="ALL" className="font-semibold text-gsb-orange">Semua Paket Tryout</SelectItem>
                        {availableTryouts.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
               
               <div className="flex items-center gap-4 w-full xl:w-auto p-2 bg-accent/30 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3 px-3 py-1.5 w-full xl:w-auto">
                     <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Urutkan:</span>
                     <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[240px] h-11 bg-background rounded-xl border border-border font-medium focus:ring-gsb-orange">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           {SORT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="w-px h-8 bg-border hidden md:block"></div>
                  <div className="px-2">
                     <Select value={limit.toString()} onValueChange={v => setLimit(Number(v))}>
                        <SelectTrigger className="w-[110px] h-11 bg-background rounded-xl border border-border font-medium focus:ring-gsb-orange">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="10">Top 10</SelectItem>
                           <SelectItem value="50">Top 50</SelectItem>
                           <SelectItem value="100">Top 100</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </div>
         </Card>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
         <Table>
            <TableHeader className="bg-accent/30 border-b border-border">
               <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] py-5 px-6 text-center font-bold text-muted-foreground">RANK</TableHead>
                  <TableHead className="py-5 font-bold text-muted-foreground">PROFIL SISWA</TableHead>
                  <TableHead className="py-5 font-bold text-muted-foreground">PAKET</TableHead>
                  <TableHead className="py-5 px-8 text-right font-bold text-muted-foreground uppercase">
                     {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  </TableHead>
               </TableRow>
            </TableHeader>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="[&_tr:last-child]:border-0">
               {displayedData.map((row, i) => (
                  <motion.tr variants={itemVariants} key={i} className="hover:bg-gsb-orange/5 border-b border-border transition-colors group">
                     <TableCell className="py-4 px-6 text-center">
                        {i === 0 ? <Trophy className="w-7 h-7 text-yellow-500 mx-auto drop-shadow-md" /> :
                         i === 1 ? <Trophy className="w-6 h-6 text-slate-400 mx-auto drop-shadow-sm" /> :
                         i === 2 ? <Trophy className="w-6 h-6 text-amber-700 mx-auto drop-shadow-sm" /> :
                         <span className="font-black text-xl text-muted-foreground/50 group-hover:text-gsb-orange transition-colors">#{i + 1}</span>}
                     </TableCell>
                     <TableCell className="py-4">
                        <p className="font-bold text-base text-foreground group-hover:text-gsb-orange transition-colors">{row.user.fullName}</p>
                        <p className="text-sm font-medium text-muted-foreground">{row.user.schoolOrigin || "-"}</p>
                     </TableCell>
                     <TableCell className="py-4">
                        <Badge variant="secondary" className="font-semibold bg-accent border-border text-muted-foreground group-hover:border-gsb-orange/30 group-hover:bg-gsb-orange/10 group-hover:text-gsb-orange transition-all">{row.tryout.title}</Badge>
                     </TableCell>
                     <TableCell className="py-4 px-8 text-right">
                        <span className="text-3xl font-black font-heading text-gsb-orange">
                           {Math.round(row.scoreDetails[sortBy as keyof typeof row.scoreDetails] as number || 0)}
                        </span>
                     </TableCell>
                  </motion.tr>
               ))}
               {displayedData.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={4} className="h-40 text-center font-medium text-muted-foreground">Tidak ada data klasemen yang ditemukan.</TableCell>
                  </TableRow>
               )}
            </motion.tbody>
         </Table>
      </motion.div>
    </motion.div>
  );
};
