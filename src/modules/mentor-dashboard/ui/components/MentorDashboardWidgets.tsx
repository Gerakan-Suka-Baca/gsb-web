import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck, X, BarChart4, Filter, PieChart as PieChartIcon, Target, ArrowUp, ArrowDown, Minus, Info, ClipboardList } from "lucide-react";
import { useState, useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
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

export const MentorDashboardWidgets = ({ passRate, unfilteredData }: MentorDashboardWidgetsProps) => {
  const [isTryoutAnalysisModalOpen, setIsTryoutAnalysisModalOpen] = useState(false);
  const [isSubtestEvaluationModalOpen, setIsSubtestEvaluationModalOpen] = useState(false);
  
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
  const modalPassRate = modalTotal > 0 ? (modalPassCount / modalTotal) * 100 : 0;
  
  const modalSubtestAvgs = useMemo(() => {
     if (modalTotal === 0) return [];
     return subtestKeys.map(sub => {
        const avg = activeModalData.reduce((acc, curr) => acc + (curr.scoreDetails?.[sub.key] || 0), 0) / modalTotal;
        return { name: sub.name, label: sub.label, avg: Math.round(avg), fullMark: 1000 };
     }).sort((a, b) => a.avg - b.avg);
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

  const quadrantData = useMemo(() => {
    return activeModalData.map((d: any) => {
       const s = d.scoreDetails || {};
       const logika = ((s.score_PU || 0) + (s.score_PM || 0) + (s.score_PK || 0)) / 3;
       const literasi = ((s.score_LBI || 0) + (s.score_LBE || 0) + (s.score_KMBM || 0) + (s.score_PPU || 0)) / 4;
       return { name: d.user?.fullName || "Siswa", logika: Math.round(logika), literasi: Math.round(literasi) };
    });
  }, [activeModalData]);

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

  // Use explicit TRPC hooks to resolve generic inference
  const trpc = useTRPC();
  const { data: ptnAnalysisDataResponse } = useQuery(trpc.mentor.getTargetPtnAnalysis.queryOptions());
  const { data: subtestStatsDataResponse } = useQuery(trpc.mentor.getDetailedSubtestStats.queryOptions());

  const ptnAnalysisData = ptnAnalysisDataResponse as any[] | undefined;
  const subtestStatsData = subtestStatsDataResponse as Record<string, any> | undefined;

  const subtestStatsForCurrentTO = useMemo(() => {
    if (!subtestStatsData || modalTryoutFilter === "all") return null;
    return subtestStatsData[modalTryoutFilter] || null;
  }, [subtestStatsData, modalTryoutFilter]);

  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.02, y: -2, transition: { duration: 0.2 } }
  };

  const modalVariants = {
     hidden: { opacity: 0, scale: 0.95 },
     visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
     exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Card 1: Analisis Tryout (Charts) */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="h-full">
           <Card className="h-full rounded-2xl border-gsb-orange/30 shadow-sm transition-all cursor-pointer bg-card hover:border-gsb-orange hover:shadow-lg hover:shadow-gsb-orange/10" onClick={() => setIsTryoutAnalysisModalOpen(true)}>
             <CardContent className="p-6 flex items-center justify-between gap-5">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-gsb-orange/10 flex items-center justify-center shrink-0 border border-gsb-orange/20">
                   <PieChartIcon className="w-6 h-6 text-gsb-orange" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Analisis Terpusat</p>
                   <h3 className="text-2xl font-black font-heading text-gsb-orange leading-tight">Analisis Tryout</h3>
                   <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Grafik, Tren PTN, dan Visualisasi Kinerja.</p>
                 </div>
               </div>
             </CardContent>
           </Card>
        </motion.div>

        {/* Card 2: Evaluasi Subtest (Details) */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="h-full" transition={{ delay: 0.1 }}>
           <Card className="h-full rounded-2xl border-gsb-red/30 shadow-sm transition-all cursor-pointer bg-card hover:border-gsb-red hover:shadow-lg hover:shadow-gsb-red/10" onClick={() => setIsSubtestEvaluationModalOpen(true)}>
             <CardContent className="p-6 flex items-center justify-between gap-5">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-gsb-red/10 flex items-center justify-center shrink-0 border border-gsb-red/20">
                   <ClipboardList className="w-6 h-6 text-gsb-red" />
                 </div>
                 <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Matriks & Detail</p>
                  <h3 className="text-2xl font-black font-heading text-gsb-red leading-tight">Evaluasi Subtest</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Statistik mendalam, Benar/Salah/Kosong.</p>
                 </div>
               </div>
             </CardContent>
           </Card>
        </motion.div>
      </div>

      {/* ==================== MODAL: ANALISIS TRYOUT (KIRI) ==================== */}
      <AnimatePresence>
         {isTryoutAnalysisModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40">
               <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-background w-full max-w-[1400px] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gsb-orange/5 px-8 py-5 border-b border-gsb-orange/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gsb-orange/15 flex items-center justify-center border border-gsb-orange/20">
                           <PieChartIcon className="w-6 h-6 text-gsb-orange" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black font-heading text-foreground">Analisis Tryout Global</h2>
                           <p className="text-muted-foreground text-sm font-medium">Visualisasi tren, distribusi, dan pemetaan kompetensi siswa secara komprehensif.</p>
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
                        <button onClick={() => setIsTryoutAnalysisModalOpen(false)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                           <X className="w-6 h-6" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50">
                     {/* Overview Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-5 border border-border hover:border-gsb-orange/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rata-rata Skor Global</p>
                           <h3 className="text-3xl font-black font-heading text-gsb-orange">{Math.round(modalAvg)}</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-5 border border-border hover:border-gsb-yellow/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pengerjaan</p>
                           <h3 className="text-3xl font-black font-heading text-foreground">{modalTotal}</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-5 border border-border hover:border-gsb-tosca/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Persentase Aman ({'>'}500)</p>
                           <h3 className={`text-3xl font-black font-heading ${modalPassRate >= 60 ? 'text-gsb-tosca' : modalPassRate >= 40 ? 'text-gsb-yellow' : 'text-gsb-red'}`}>{modalPassRate.toFixed(1)}%</h3>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-5 border border-border hover:border-gsb-red/30 transition-colors shadow-sm">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Lulus / Gagal</p>
                           <div className="flex items-center gap-3">
                              <span className="text-xl font-black text-emerald-600">{modalPassCount}</span>
                              <span className="text-xl font-black text-slate-300">/</span>
                              <span className="text-xl font-black text-rose-500">{modalTotal - modalPassCount}</span>
                           </div>
                        </motion.div>
                     </div>

                     {/* ROW 1: Riwayat Skor Tryout (LINE CHART) + Tingkat Aman Per Tryout (BAR CHART) */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white border border-border rounded-2xl p-6 lg:p-8 flex flex-col shadow-sm">
                           <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <h3 className="text-lg font-bold font-heading text-foreground">Perbandingan Skor Antar Tryout</h3>
                              <div className="relative shrink-0">
                                 <select 
                                    className="appearance-none bg-slate-50 border border-slate-200 text-xs py-2 pl-3 pr-8 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-gsb-orange transition-colors"
                                    value={selectedGlobalMetric}
                                    onChange={(e) => setSelectedGlobalMetric(e.target.value)}
                                 >
                                    <option value="finalScore">Skor Akhir (Global)</option>
                                    {subtestKeys.map((k) => (
                                       <option key={k.key} value={k.key}>{k.label} — {k.name}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                           <div className="w-full flex-1 min-h-[280px]">
                              {globalTrendData.length > 0 ? (
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

                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white border border-border rounded-2xl p-6 lg:p-8 flex flex-col shadow-sm">
                           <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-emerald-500"/></div>
                              <h3 className="text-lg font-bold font-heading text-foreground">Tingkat Aman per Tryout</h3>
                           </div>
                           <div className="h-[280px] w-full">
                              {passRatePerTryout.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={passRatePerTryout} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                       <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                                       <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fontWeight: 600 }} />
                                       <RechartsTooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold' }} />
                                       <Bar dataKey="rate" name="Aman %" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="flex items-center justify-center h-full text-muted-foreground border border-dashed rounded-xl font-medium">Belum ada data.</div>
                              )}
                           </div>
                        </motion.div>
                     </div>

                     {/* ROW 2: PTN DISTRIBUTION + KUADRAN */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm">
                           <div className="mb-4">
                              <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500"/> PTN Pilihan Terbanyak vs Rate Lulus</h3>
                           </div>
                           <div className="h-[300px] w-full">
                              {ptnAnalysisData && ptnAnalysisData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ptnAnalysisData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                       <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                                       <YAxis yAxisId="left" orientation="left" stroke="#6366f1" tick={{ fontSize: 11 }} />
                                       <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                                       <RechartsTooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold' }} />
                                       <Bar yAxisId="left" dataKey="total" name="Pendaftar" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                       <Bar yAxisId="right" dataKey="passRate" name="Aman %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="flex items-center justify-center h-full text-slate-400 text-sm">Data PTN Kosong</div>
                              )}
                           </div>
                        </motion.div>

                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm">
                           <div className="mb-4">
                              <h3 className="text-lg font-bold font-heading text-foreground">Kuadran Logika vs Literasi</h3>
                           </div>
                           <div className="h-[300px] w-full">
                              {quadrantData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis type="number" dataKey="logika" name="Logika" domain={[0, 1000]} tick={{ fontSize: 11 }} />
                                      <YAxis type="number" dataKey="literasi" name="Literasi" domain={[0, 1000]} tick={{ fontSize: 11 }} />
                                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', fontWeight: 'bold' }} />
                                      <ReferenceLine x={500} stroke="#f97316" strokeDasharray="4 4" />
                                      <ReferenceLine y={500} stroke="#f97316" strokeDasharray="4 4" />
                                      <Scatter name="Siswa" data={quadrantData} fill="#f97316" fillOpacity={0.7} />
                                   </ScatterChart>
                                 </ResponsiveContainer>
                              ) : (
                                 <div className="flex items-center justify-center h-full text-slate-400 text-sm">Belum ada data kompetensi.</div>
                              )}
                           </div>
                        </motion.div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ==================== MODAL: EVALUASI SUBTEST (KANAN) ==================== */}
      <AnimatePresence>
         {isSubtestEvaluationModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40">
               <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-background w-full max-w-[1400px] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gsb-red/5 px-8 py-5 border-b border-gsb-red/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gsb-red/15 flex items-center justify-center border border-gsb-red/20">
                           <ClipboardList className="w-6 h-6 text-gsb-red" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black font-heading text-foreground">Evaluasi Per Subtest</h2>
                           <p className="text-muted-foreground text-sm font-medium">Statistik mendalam per subtest termasuk analisis performa menjawab Benar, Salah, dan Kosong.</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <select 
                              className="appearance-none bg-background border border-border text-foreground py-2.5 pl-4 pr-10 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gsb-red w-full sm:w-[250px] shadow-sm hover:border-gsb-red/50 transition-colors"
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
                           <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gsb-red/50 pointer-events-none" />
                        </div>
                        <button onClick={() => setIsSubtestEvaluationModalOpen(false)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                           <X className="w-6 h-6" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50">
                     {/* MATRIX SECTION: CORRECT/WRONG/EMPTY */}
                     {modalTryoutFilter !== "all" && subtestStatsForCurrentTO && (
                        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center border border-orange-200">
                                 <Activity className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold font-heading text-slate-800">Matriks Performa Menjawab</h3>
                                 <p className="text-sm text-slate-500 font-medium">Perbandingan rata-rata jumlah jawaban Benar, Salah, dan Kosong untuk paket <strong>{modalTryoutFilter}</strong>.</p>
                              </div>
                           </div>
                           
                           <div className="overflow-hidden border border-slate-200 rounded-xl">
                              <table className="w-full">
                                 <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                       <th className="text-left py-4 px-6 font-bold text-slate-600 uppercase tracking-wider text-xs">Subtest</th>
                                       <th className="text-center py-4 px-6 font-bold text-emerald-600 uppercase tracking-wider text-xs">Benar</th>
                                       <th className="text-center py-4 px-6 font-bold text-rose-500 uppercase tracking-wider text-xs">Salah</th>
                                       <th className="text-center py-4 px-6 font-bold text-amber-500 uppercase tracking-wider text-xs">Kosong</th>
                                       <th className="text-center py-4 px-6 font-bold text-slate-400 uppercase tracking-wider text-xs">Total Soal (Est)</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 bg-white">
                                    {subtestKeys.map((sub) => {
                                       const stats = subtestStatsForCurrentTO[sub.label] || { avgCorrect: 0, avgWrong: 0, avgEmpty: 0 };
                                       const total = Math.round(stats.avgCorrect + stats.avgWrong + stats.avgEmpty);
                                       return (
                                          <tr key={sub.key} className="hover:bg-slate-50 transition-colors">
                                             <td className="py-4 px-6">
                                                <div className="font-bold text-slate-800">{sub.label}</div>
                                                <div className="text-[11px] text-slate-500 font-medium">{sub.name}</div>
                                             </td>
                                             <td className="py-4 px-6 text-center">
                                                <div className="text-lg font-black text-emerald-600">{stats.avgCorrect}</div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                   <div className="bg-emerald-500 h-full" style={{ width: `${(stats.avgCorrect / (total || 1)) * 100}%` }}></div>
                                                </div>
                                             </td>
                                             <td className="py-4 px-6 text-center">
                                                <div className="text-lg font-black text-rose-500">{stats.avgWrong}</div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                   <div className="bg-rose-500 h-full" style={{ width: `${(stats.avgWrong / (total || 1)) * 100}%` }}></div>
                                                </div>
                                             </td>
                                             <td className="py-4 px-6 text-center">
                                                <div className="text-lg font-black text-amber-500">{stats.avgEmpty}</div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                   <div className="bg-amber-400 h-full" style={{ width: `${(stats.avgEmpty / (total || 1)) * 100}%` }}></div>
                                                </div>
                                             </td>
                                             <td className="py-4 px-6 text-center font-bold text-slate-400">
                                                {total}
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                        </motion.div>
                     )}

                     {modalTryoutFilter === "all" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center gap-4 text-blue-700 shadow-sm">
                           <Info className="w-6 h-6 shrink-0" />
                           <p className="font-semibold text-sm">Pilih <strong>Satu Paket Tryout Spesifik</strong> pada Dropdown di sudut kanan atas untuk melihat Analisis Detail Matriks (Benar / Salah / Kosong).</p>
                        </div>
                     )}

                     {/* STATISTIC CARDS PER SUBTEST */}
                     <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100">
                              <BarChart4 className="w-5 h-5 text-teal-600" />
                           </div>
                           <div>
                              <h3 className="text-lg font-bold font-heading text-slate-800">Detail Skor & Ekstrem</h3>
                              <p className="text-sm text-slate-500 font-medium">Rekapitulasi Max/Min, Aman Kritis per subtest berdasarkan data yang difilter.</p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {perSubtestStats.map((sub) => (
                              <div key={sub.key} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-gsb-red/40 hover:shadow-md transition-all group">
                                 <div className="flex items-center justify-between mb-3">
                                    <div>
                                       <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sub.label}</p>
                                       <p className="text-sm font-bold text-slate-800 leading-tight">{sub.name}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black ${sub.avg >= 600 ? 'bg-emerald-50 text-emerald-600' : sub.avg >= 500 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                       {sub.avg >= 600 ? <ArrowUp className="w-5 h-5"/> : sub.avg >= 500 ? <Minus className="w-5 h-5"/> : <ArrowDown className="w-5 h-5"/>}
                                    </div>
                                 </div>
                                 <p className="text-3xl font-black font-heading text-slate-800 mb-4">{sub.avg}</p>
                                 <div className="space-y-2 text-xs">
                                    <div className="flex justify-between"><span className="text-slate-500 font-medium">Median</span><span className="font-bold text-slate-700">{sub.median}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500 font-medium">Kritis / Terendah</span><span className="font-bold text-rose-500">{sub.min}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500 font-medium">Aman / Tertinggi</span><span className="font-bold text-emerald-600">{sub.max}</span></div>
                                    <div className="border-t border-slate-100 my-2"></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Status ({">"}500)</span>
                                       <span className={`font-black px-2 py-0.5 rounded ${sub.passRate >= 60 ? 'bg-emerald-50 text-emerald-600' : sub.passRate >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                          Lulus: {sub.passRate}%
                                       </span>
                                    </div>
                                 </div>
                                 {/* Mini progress bar */}
                                 <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${sub.avg >= 600 ? 'bg-emerald-500' : sub.avg >= 500 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{width: `${Math.min((sub.avg / 1000) * 100, 100)}%`}}></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </motion.div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </>
  );
};
