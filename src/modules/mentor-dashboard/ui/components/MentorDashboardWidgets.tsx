import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck, TrendingDown, X, BarChart4, Filter, Users, PieChart as PieChartIcon, Target, AlertTriangle, CheckCircle2, XCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine
} from "recharts";

interface MentorDashboardWidgetsProps {
  totalScores: number;
  avgScore: number;
  passRate: number;
  hardestSubject: { name: string; avg: number };
  rawFilteredData?: any[];
  unfilteredData: any[];
}

export const MentorDashboardWidgets = ({ totalScores, avgScore, passRate, hardestSubject, unfilteredData }: MentorDashboardWidgetsProps) => {
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isPassRateModalOpen, setIsPassRateModalOpen] = useState(false);
  const [selectedGlobalMetric, setSelectedGlobalMetric] = useState<string>("finalScore");
  const [modalTryoutFilter, setModalTryoutFilter] = useState<string>("all");

  const subtestKeys = [
     { label: "PU", name: "Penalaran Umum", key: "score_PU" },
     { label: "PK", name: "Pengetahuan Kuantitatif", key: "score_PK" },
     { label: "PM", name: "Penalaran Matematika", key: "score_PM" },
     { label: "LBE", name: "Literasi B. Inggris", key: "score_LBE" },
     { label: "LBI", name: "Literasi B. Indonesia", key: "score_LBI" },
     { label: "PPU", name: "Pengetahuan Pemahaman", key: "score_PPU" },
     { label: "KMBM", name: "Kemampuan Membaca", key: "score_KMBM" }
  ];

  const availableTryouts = useMemo(() => Array.from(new Set(unfilteredData?.map(d => d.tryout?.title).filter(Boolean))), [unfilteredData]);

  const activeModalData = useMemo(() => {
     if (!unfilteredData) return [];
     if (modalTryoutFilter === "all") return unfilteredData;
     return unfilteredData.filter((d: any) => d.tryout?.title === modalTryoutFilter);
  }, [unfilteredData, modalTryoutFilter]);

  const modalTotal = activeModalData.length;
  const modalAvg = modalTotal > 0 ? activeModalData.reduce((acc, curr) => acc + (curr.scoreDetails?.finalScore || 0), 0) / modalTotal : 0;
  const modalPassCount = activeModalData.filter(d => (d.scoreDetails?.finalScore || 0) >= 500).length;
  const modalFailCount = modalTotal - modalPassCount;
  const modalPassRate = modalTotal > 0 ? (modalPassCount / modalTotal) * 100 : 0;
  
  const modalSubtestAvgs = useMemo(() => {
     if (modalTotal === 0) return [];
     const avgs = subtestKeys.map(sub => {
        const avg = activeModalData.reduce((acc, curr) => acc + (curr.scoreDetails?.[sub.key] || 0), 0) / modalTotal;
        return { name: sub.name, label: sub.label, avg: Math.round(avg), fullMark: 1000 };
     });
     return avgs.sort((a, b) => a.avg - b.avg);
  }, [activeModalData, modalTotal]);

  const modalRadarData = useMemo(() => {
     if (modalTotal === 0) return [];
     return subtestKeys.map(sub => {
        const avg = activeModalData.reduce((acc, curr) => acc + (curr.scoreDetails?.[sub.key] || 0), 0) / modalTotal;
        return { subject: sub.label, name: sub.name, score: Math.round(avg) };
     });
  }, [activeModalData, modalTotal]);

  const scoreDistribution = useMemo(() => {
     const brackets: Record<string, number> = { "< 400": 0, "400 - 500": 0, "500 - 600": 0, "600 - 700": 0, "> 700": 0 };
     activeModalData.forEach(d => {
        const score = d.scoreDetails?.finalScore || 0;
        if (score < 400) brackets["< 400"]++;
        else if (score >= 400 && score < 500) brackets["400 - 500"]++;
        else if (score >= 500 && score < 600) brackets["500 - 600"]++;
        else if (score >= 600 && score < 700) brackets["600 - 700"]++;
        else brackets["> 700"]++;
     });
     return Object.entries(brackets).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [activeModalData]);
  const pieColors = ['#e63946', '#e85d04', '#ffba08', '#00b4d8', '#2a9d8f']; 

  const globalTrendData = useMemo(() => {
     if (!unfilteredData || unfilteredData.length === 0) return [];
     const tryoutGroups = unfilteredData.reduce((acc: any, curr: any) => {
         const title = curr.tryout?.title || "Unknown";
         if (!acc[title]) acc[title] = [];
         acc[title].push(curr);
         return acc;
     }, {});

     const res = Object.entries(tryoutGroups).map(([title, scores]: [string, any]) => {
         const totalValidScores = scores.length;
         let sum = scores.reduce((total: number, s: any) => total + (selectedGlobalMetric === "finalScore" ? (s.scoreDetails?.finalScore || 0) : (s.scoreDetails?.[selectedGlobalMetric] || 0)), 0);
         return {
             name: title.replace(/Paket /gi, 'TO ').replace(/Tryout /gi, ''),
             fullTitle: title,
             avg: totalValidScores > 0 ? Math.round(sum / totalValidScores) : 0
         };
     });
     return res.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
  }, [unfilteredData, selectedGlobalMetric]);

  // Quadrant: Logika vs Literasi
  const quadrantData = useMemo(() => {
    return activeModalData.map((d: any) => {
       const s = d.scoreDetails || {};
       const logika = ((s.score_PU || 0) + (s.score_PM || 0) + (s.score_PK || 0)) / 3;
       const literasi = ((s.score_LBI || 0) + (s.score_LBE || 0) + (s.score_KMBM || 0) + (s.score_PPU || 0)) / 4;
       return { name: d.user?.fullName || "Siswa", logika: Math.round(logika), literasi: Math.round(literasi) };
    });
  }, [activeModalData]);

  // Per-subtest detailed stats
  const perSubtestStats = useMemo(() => {
    if (modalTotal === 0) return [];
    return subtestKeys.map(sub => {
      const scores = activeModalData.map(d => d.scoreDetails?.[sub.key] || 0).sort((a: number, b: number) => a - b);
      const sum = scores.reduce((a: number, b: number) => a + b, 0);
      const avg = Math.round(sum / scores.length);
      const min = Math.round(scores[0]);
      const max = Math.round(scores[scores.length - 1]);
      const median = Math.round(scores.length % 2 === 0 ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2 : scores[Math.floor(scores.length / 2)]);
      const passCount = scores.filter((s: number) => s >= 500).length;
      const passRate = Math.round((passCount / scores.length) * 100);
      const below400 = scores.filter((s: number) => s < 400).length;
      return { ...sub, avg, min, max, median, passCount, passRate, below400, total: scores.length };
    });
  }, [activeModalData, modalTotal]);

  // Pass Rate per Tryout for the Pass Rate modal
  const passRatePerTryout = useMemo(() => {
     if (!unfilteredData || unfilteredData.length === 0) return [];
     const groups = unfilteredData.reduce((acc: any, curr: any) => {
        const title = curr.tryout?.title || "Unknown";
        if (!acc[title]) acc[title] = { total: 0, pass: 0 };
        acc[title].total++;
        if ((curr.scoreDetails?.finalScore || 0) >= 500) acc[title].pass++;
        return acc;
     }, {});
     return Object.entries(groups).map(([title, stats]: [string, any]) => ({
        name: title.replace(/Paket /gi, 'TO ').replace(/Tryout /gi, ''),
        fullTitle: title,
        rate: Math.round((stats.pass / stats.total) * 100),
        pass: stats.pass,
        fail: stats.total - stats.pass,
        total: stats.total
     })).sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
  }, [unfilteredData]);

  // Framer Animations
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { scale: 1.02, y: -4, transition: { duration: 0.2 } }
  };

  const modalVariants = {
     hidden: { opacity: 0, scale: 0.95 },
     visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
     exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Rata-rata Skor → opens main analytics */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="h-full">
           <Card className="h-full rounded-2xl border-gsb-orange/30 shadow-sm transition-all cursor-pointer bg-card hover:border-gsb-orange hover:shadow-lg hover:shadow-gsb-orange/10" onClick={() => setIsAnalyticsModalOpen(true)}>
             <CardContent className="p-6 flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-gsb-orange/10 flex items-center justify-center shrink-0 border border-gsb-orange/20">
                 <Activity className="w-6 h-6 text-gsb-orange" />
               </div>
               <div className="flex-1">
                 <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Evaluasi Subtest</p>
                 <h3 className="text-3xl font-black font-heading text-gsb-orange">{Math.round(avgScore)}</h3>
                 <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Rata-rata Skor Global</p>
               </div>
             </CardContent>
           </Card>
        </motion.div>

        {/* Card 2: Persentase Aman → opens pass rate modal */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="h-full" transition={{ delay: 0.1 }}>
           <Card className="h-full rounded-2xl border-gsb-tosca/30 shadow-sm transition-all cursor-pointer bg-card hover:border-gsb-tosca hover:shadow-lg hover:shadow-gsb-tosca/10" onClick={() => setIsPassRateModalOpen(true)}>
             <CardContent className="p-6 flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-gsb-tosca/10 flex items-center justify-center shrink-0 border border-gsb-tosca/20">
                 <ShieldCheck className="w-6 h-6 text-gsb-tosca" />
               </div>
               <div>
                 <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Tingkat Aman ({">"}500)</p>
                 <h3 className="text-3xl font-black font-heading text-gsb-tosca">{passRate.toFixed(1)}%</h3>
                 <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Klik untuk detail per tryout</p>
               </div>
             </CardContent>
           </Card>
        </motion.div>

        {/* Card 3: Subtes Evaluasi Terendah → opens analytics */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="h-full" transition={{ delay: 0.2 }}>
           <Card className="h-full rounded-2xl border-gsb-red/30 shadow-sm transition-all cursor-pointer bg-card hover:border-gsb-red hover:shadow-lg hover:shadow-gsb-red/10" onClick={() => setIsAnalyticsModalOpen(true)}>
             <CardContent className="p-6 flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-gsb-red/10 flex items-center justify-center shrink-0 border border-gsb-red/20">
                 <TrendingDown className="w-6 h-6 text-gsb-red" />
               </div>
               <div className="flex-1">
                  <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Evaluasi Subtes Terlemah</p>
                  <h3 className="text-lg font-black font-heading text-gsb-red leading-tight">{hardestSubject?.name || "-"}</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Rata-rata: {hardestSubject?.avg ? Math.round(hardestSubject.avg) : "-"}</p>
               </div>
             </CardContent>
           </Card>
        </motion.div>
      </div>

      {/* ==================== MODAL: PERSENTASE AMAN ==================== */}
      <AnimatePresence>
         {isPassRateModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40">
               <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-background w-full max-w-[900px] max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gsb-tosca/5 px-8 py-5 border-b border-gsb-tosca/20 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gsb-tosca/15 flex items-center justify-center border border-gsb-tosca/20">
                           <ShieldCheck className="w-6 h-6 text-gsb-tosca" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black font-heading text-foreground">Analisis Persentase Aman</h2>
                           <p className="text-muted-foreground text-sm font-medium">Perbandingan jumlah siswa aman ({">"}500) per paket tryout.</p>
                        </div>
                     </div>
                     <button onClick={() => setIsPassRateModalOpen(false)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                     {/* Summary row */}
                     <div className="grid grid-cols-3 gap-4">
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-gsb-tosca/30 transition-colors shadow-sm text-center">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Siswa</p>
                           <h3 className="text-3xl font-black font-heading text-foreground">{unfilteredData?.length || 0}</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-green-500/30 transition-colors shadow-sm text-center">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500"/> Aman</p>
                           <h3 className="text-3xl font-black font-heading text-green-600">{unfilteredData?.filter(d => (d.scoreDetails?.finalScore || 0) >= 500).length || 0}</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-gsb-red/30 transition-colors shadow-sm text-center">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3 text-gsb-red"/> Belum Aman</p>
                           <h3 className="text-3xl font-black font-heading text-gsb-red">{unfilteredData?.filter(d => (d.scoreDetails?.finalScore || 0) < 500).length || 0}</h3>
                        </motion.div>
                     </div>

                     {/* Bar chart: pass rate per tryout */}
                     <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold font-heading text-foreground mb-4">Persentase Aman per Paket Tryout</h3>
                        <div className="h-[300px] w-full">
                           {passRatePerTryout.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={passRatePerTryout} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fontWeight: 600 }} />
                                    <RechartsTooltip
                                       contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}
                                       formatter={(value: any) => [`${value}%`, 'Persentase Aman']}
                                       labelFormatter={(label: any, payload: any) => payload[0]?.payload.fullTitle || label}
                                    />
                                    <Bar dataKey="rate" name="Aman %" fill="#2a9d8f" radius={[6, 6, 0, 0]} barSize={40} />
                                 </BarChart>
                              </ResponsiveContainer>
                           ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground border border-dashed rounded-xl font-medium">Belum ada data.</div>
                           )}
                        </div>
                     </div>

                     {/* Detail table per tryout */}
                     <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold font-heading text-foreground mb-4">Rincian per Paket Tryout</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                              <thead>
                                 <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Paket</th>
                                    <th className="text-center py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Total</th>
                                    <th className="text-center py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Aman</th>
                                    <th className="text-center py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Belum</th>
                                    <th className="text-right py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Rate</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {passRatePerTryout.map((row) => (
                                    <tr key={row.fullTitle} className="border-b border-border hover:bg-gsb-tosca/5 transition-colors">
                                       <td className="py-3 px-4 font-semibold text-foreground">{row.fullTitle}</td>
                                       <td className="py-3 px-4 text-center font-semibold">{row.total}</td>
                                       <td className="py-3 px-4 text-center font-bold text-green-600">{row.pass}</td>
                                       <td className="py-3 px-4 text-center font-bold text-gsb-red">{row.fail}</td>
                                       <td className="py-3 px-4 text-right">
                                          <span className={`font-black text-lg ${row.rate >= 60 ? 'text-gsb-tosca' : row.rate >= 40 ? 'text-gsb-yellow' : 'text-gsb-red'}`}>{row.rate}%</span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ==================== MODAL: ANALYTICS UTAMA ==================== */}
      <AnimatePresence>
         {isAnalyticsModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40">
               <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-background w-full max-w-[1400px] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gsb-orange/5 px-8 py-5 border-b border-gsb-orange/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gsb-orange/15 flex items-center justify-center border border-gsb-orange/20">
                           <BarChart4 className="w-6 h-6 text-gsb-orange" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black font-heading text-foreground">Evaluasi Subtest</h2>
                           <p className="text-muted-foreground text-sm font-medium">Analisis performa per subtest dan perbandingan antar paket tryout.</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <select 
                              className="appearance-none bg-background border border-border text-foreground py-2.5 pl-4 pr-10 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gsb-orange w-full sm:w-[250px] shadow-sm hover:border-gsb-orange/50 transition-colors"
                              value={modalTryoutFilter}
                              onChange={(e) => setModalTryoutFilter(e.target.value)}
                           >
                              <option value="all">Semua Paket Tryout</option>
                              <optgroup label="Spesifik Paket">
                                 {availableTryouts.map((opt: any) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                 ))}
                              </optgroup>
                           </select>
                           <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gsb-orange/50 pointer-events-none" />
                        </div>
                        <button onClick={() => setIsAnalyticsModalOpen(false)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                           <X className="w-6 h-6" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                     {/* Overview Cards - each shows DIFFERENT data */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-gsb-orange/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Rata-rata Skor Global</p>
                           <h3 className="text-3xl font-black font-heading text-gsb-orange">{Math.round(modalAvg)}</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-gsb-yellow/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Pengerjaan</p>
                           <h3 className="text-3xl font-black font-heading text-foreground">{modalTotal}</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-gsb-tosca/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Persentase Aman</p>
                           <h3 className={`text-3xl font-black font-heading ${modalPassRate >= 60 ? 'text-gsb-tosca' : modalPassRate >= 40 ? 'text-gsb-yellow' : 'text-gsb-red'}`}>{modalPassRate.toFixed(1)}%</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 border border-border hover:border-gsb-red/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Subtes Terlemah</p>
                           <h3 className="text-lg font-black font-heading text-gsb-red leading-tight">{modalSubtestAvgs.length > 0 ? modalSubtestAvgs[0].name : "-"}</h3>
                           <p className="text-xs text-muted-foreground font-semibold mt-0.5">Skor: {modalSubtestAvgs.length > 0 ? modalSubtestAvgs[0].avg : "-"}</p>
                        </motion.div>
                     </div>

                     {/* EVALUASI PER SUBTEST - detailed cards */}
                     <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.05}} className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
                        <h3 className="text-lg font-bold font-heading text-foreground mb-1">Evaluasi Per Subtest</h3>
                        <p className="text-sm text-muted-foreground font-medium mb-6">Statistik lengkap setiap subtest: rata-rata, median, min, max, dan tingkat kelulusan ambang batas 500.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                           {perSubtestStats.map((sub) => (
                              <div key={sub.key} className="bg-background border border-border rounded-xl p-5 hover:border-gsb-orange/40 transition-colors group">
                                 <div className="flex items-center justify-between mb-3">
                                    <div>
                                       <p className="text-[10px] font-bold uppercase tracking-wider text-gsb-orange">{sub.label}</p>
                                       <p className="text-sm font-bold text-foreground leading-tight">{sub.name}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black ${sub.avg >= 600 ? 'bg-gsb-tosca/10 text-gsb-tosca' : sub.avg >= 500 ? 'bg-gsb-yellow/10 text-gsb-yellow' : 'bg-gsb-red/10 text-gsb-red'}`}>
                                       {sub.avg >= 600 ? <ArrowUp className="w-5 h-5"/> : sub.avg >= 500 ? <Minus className="w-5 h-5"/> : <ArrowDown className="w-5 h-5"/>}
                                    </div>
                                 </div>
                                 <p className="text-3xl font-black font-heading text-foreground mb-3">{sub.avg}</p>
                                 <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Median</span><span className="font-bold text-foreground">{sub.median}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Terendah</span><span className="font-bold text-gsb-red">{sub.min}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Tertinggi</span><span className="font-bold text-gsb-tosca">{sub.max}</span></div>
                                    <div className="border-t border-border my-1.5"></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Aman ({">"}500)</span><span className="font-bold text-foreground">{sub.passCount}/{sub.total}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Rate Aman</span><span className={`font-black ${sub.passRate >= 60 ? 'text-gsb-tosca' : sub.passRate >= 40 ? 'text-gsb-yellow' : 'text-gsb-red'}`}>{sub.passRate}%</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Kritis ({"<"}400)</span><span className="font-bold text-gsb-red">{sub.below400}</span></div>
                                 </div>
                                 {/* Mini progress bar */}
                                 <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${sub.avg >= 600 ? 'bg-gsb-tosca' : sub.avg >= 500 ? 'bg-gsb-yellow' : 'bg-gsb-red'}`} style={{width: `${Math.min((sub.avg / 1000) * 100, 100)}%`}}></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </motion.div>

                     {/* ROW 1: Riwayat Skor Tryout (LINE CHART) + Sebaran Skor (PIE CHART) */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="bg-card border border-border rounded-2xl p-6 lg:p-8 lg:col-span-2 flex flex-col shadow-sm">
                           <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <h3 className="text-lg font-bold font-heading text-foreground">Perbandingan Skor Antar Paket Tryout</h3>
                              <div className="relative shrink-0">
                                 <select 
                                    className="appearance-none bg-background border border-border text-sm py-2 pl-3 pr-8 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-gsb-orange hover:border-gsb-orange/50 transition-colors"
                                    value={selectedGlobalMetric}
                                    onChange={(e) => setSelectedGlobalMetric(e.target.value)}
                                 >
                                    <option value="finalScore">Skor Akhir (Global)</option>
                                    {subtestKeys.map(k => (
                                       <option key={k.key} value={k.key}>{k.label} — {k.name}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                           <div className="w-full flex-1 min-h-[280px]">
                              {globalTrendData && globalTrendData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <LineChart data={globalTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                                      <YAxis domain={[0, 1000]} tick={{ fontSize: 11, fontWeight: 600 }} />
                                      <RechartsTooltip 
                                         contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}
                                         labelFormatter={(label, payload) => payload[0]?.payload.fullTitle || label}
                                      />
                                      <Line type="monotone" dataKey="avg" name="Rata-rata" stroke="#f97316" strokeWidth={3} activeDot={{ r: 7, fill: '#f97316' }} dot={{ fill: '#f97316', r: 4 }} />
                                   </LineChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="flex items-center justify-center h-full text-muted-foreground border border-dashed rounded-xl font-medium">Belum ada data.</div>
                              )}
                           </div>
                        </motion.div>

                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.15}} className="bg-card border border-border rounded-2xl p-6 flex flex-col shadow-sm">
                           <h3 className="text-lg font-bold font-heading text-foreground mb-4">Sebaran Skor Siswa</h3>
                           <div className="h-[230px] w-full flex items-center relative">
                              {scoreDistribution.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                     <Pie data={scoreDistribution} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                       {scoreDistribution.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                       ))}
                                     </Pie>
                                     <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                                   </PieChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-xl font-medium">Pilih Tryout</div>
                              )}
                           </div>
                           <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
                              {scoreDistribution.map((d, i) => (
                                 <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: pieColors[i % pieColors.length]}}></span> {d.name} ({d.value})
                                 </div>
                              ))}
                           </div>
                        </motion.div>
                     </div>

                     {/* ROW 2: Kuadran Kompetensi (SCATTER) */}
                     <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-card border border-border rounded-2xl p-6 lg:p-8 flex flex-col shadow-sm">
                        <div className="mb-6">
                           <h3 className="text-lg font-bold font-heading text-foreground">Analisis Kuadran Kompetensi (Logika vs Literasi)</h3>
                           <p className="text-sm text-muted-foreground mt-1 font-medium">Pemetaan kemampuan dari kelompok subtes Logika (PU, PM, PK) dan Literasi (LBI, LBE, KMBM, PPU). Ambang batas aman: <strong className="text-gsb-orange">skor 500</strong>.</p>
                        </div>
                        <div className="h-[400px] w-full">
                           {quadrantData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                   <XAxis type="number" dataKey="logika" name="Kemampuan Logika" domain={[0, 1000]} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} label={{ value: '← Logika Rendah — Logika Tinggi →', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#94a3b8' }} />
                                   <YAxis type="number" dataKey="literasi" name="Kemampuan Literasi" domain={[0, 1000]} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} width={50} label={{ value: '← Literasi Rendah — Literasi Tinggi →', angle: -90, position: 'insideLeft', offset: 20, fontSize: 11, fill: '#94a3b8' }} />
                                   <ZAxis type="number" range={[100, 100]} />
                                   <RechartsTooltip 
                                      cursor={{ strokeDasharray: '3 3' }} 
                                      content={({ active, payload }) => {
                                         if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                               <div className="bg-popover border border-border p-4 rounded-xl shadow-lg">
                                                  <p className="font-bold font-heading text-base text-foreground mb-2">{data.name}</p>
                                                  <div className="flex gap-4">
                                                     <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Logika</p>
                                                        <p className="font-black text-gsb-orange text-lg">{data.logika}</p>
                                                     </div>
                                                     <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Literasi</p>
                                                        <p className="font-black text-gsb-blue text-lg">{data.literasi}</p>
                                                     </div>
                                                  </div>
                                               </div>
                                            );
                                         }
                                         return null;
                                      }}
                                   />
                                   <ReferenceLine x={500} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} />
                                   <ReferenceLine y={500} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} />
                                   <Scatter name="Siswa" data={quadrantData} fill="#f97316" fillOpacity={0.7} />
                                </ScatterChart>
                              </ResponsiveContainer>
                           ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground border border-dashed rounded-xl font-medium">Belum ada data kompetensi.</div>
                           )}
                        </div>
                     </motion.div>

                     {/* ROW 3: Bar Chart Subtes + Radar Distribution */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.25}} className="bg-card border border-border rounded-2xl p-6 lg:p-8 lg:col-span-2 flex flex-col shadow-sm">
                           <h3 className="text-lg font-bold font-heading text-foreground mb-6">Rata-rata Skor per Subtes</h3>
                           <div className="h-[350px] w-full">
                              {modalSubtestAvgs.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={modalSubtestAvgs} margin={{ top: 10, right: 20, left: -20, bottom: 0 }} layout="vertical">
                                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                      <XAxis type="number" domain={[0, 1000]} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                                      <YAxis dataKey="label" type="category" width={60} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                                      <RechartsTooltip cursor={{fill: '#fff7ed'}} contentStyle={{ borderRadius: '12px', border: '1px solid #fdba74', fontWeight: 'bold' }} />
                                      <Bar dataKey="avg" name="Skor" fill="#f97316" radius={[0, 6, 6, 0]} barSize={24} />
                                   </BarChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-xl font-medium">Belum ada data</div>
                              )}
                           </div>
                        </motion.div>

                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}} className="bg-card border border-border rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center shadow-sm">
                           <h3 className="text-lg font-bold font-heading text-foreground mb-4 border-b border-border pb-4 w-full text-center">Distribusi Radar Subtes</h3>
                           <div className="h-[300px] w-full mt-2">
                              {modalRadarData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={modalRadarData}>
                                     <PolarGrid stroke="#e2e8f0" />
                                     <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} />
                                     <PolarRadiusAxis angle={30} domain={[0, 1000]} tick={false} />
                                     <Radar name="Skor Rata-rata" dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.25} strokeWidth={3} />
                                     <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #fdba74', fontWeight: 'bold' }} />
                                   </RadarChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-xl font-medium">Belum ada data</div>
                              )}
                           </div>
                        </motion.div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </>
  );
};
