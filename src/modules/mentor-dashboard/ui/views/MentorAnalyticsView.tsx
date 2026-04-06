"use client";

import React, { useState, useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Download, Filter, RefreshCw, XCircle, CheckCircle, Ticket, CreditCard, AlertCircle, TrendingUp, Users, PieChart as PieChartIcon } from "lucide-react";

export const MentorAnalyticsView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tryoutFilter, setTryoutFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  const trpc = useTRPC();
  const { data: rawData, isLoading, isError, isRefetching, refetch } = useQuery({
    ...trpc.mentor.getCompletionAnalytics.queryOptions(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const data = rawData as any[] | undefined;

  const availableTryouts = useMemo(() => Array.from(new Set(data?.map((d: any) => d.tryoutTitle) || [])), [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item: any) => {
      const matchSearch = (item.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.tryoutTitle || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchTryout = tryoutFilter === "all" || item.tryoutTitle === tryoutFilter;
      const matchPayment = paymentFilter === "all" || item.paymentMethod === paymentFilter || item.resultPlan === paymentFilter;
      const matchScore = scoreFilter === "all" || 
                         (scoreFilter === "released" && item.scoreStatus === "Sudah Rilis") || 
                         (scoreFilter === "waiting" && item.scoreStatus === "Belum Rilis");

      return matchSearch && matchTryout && matchPayment && matchScore;
    });
  }, [data, searchTerm, tryoutFilter, paymentFilter, scoreFilter]);

  const releasedData = useMemo(
    () => filteredData.filter((d: any) => d.scoreStatus === "Sudah Rilis" && d.finalScore !== null && d.finalScore !== undefined),
    [filteredData]
  );
  const totalSelesai = filteredData.filter((d: any) => d.completionStatus === "Selesai").length;
  const totalRilis = releasedData.length;
  // Compute analytics from released-score subset
  const passCount = releasedData.filter((d: any) => (d.finalScore ?? 0) >= 500).length;
  const avgFilteredScore = totalRilis > 0
    ? releasedData.reduce((acc: number, d: any) => acc + (d.finalScore || 0), 0) / totalRilis
    : 0;

  // Payment method breakdown
  const paymentMethodCount = filteredData.reduce((acc: any, curr) => {
    const method = curr.paymentMethod === 'none' ? curr.resultPlan : curr.paymentMethod;
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const handleExport = () => {
     if (filteredData.length === 0) return;
     const headers = ["Nama", "Email", "Tryout", "Status Pengerjaan", "Status Rilis", "Method Transaksi", "Skor Akhir", "Waktu Pengerjaan"];
     const csvContent = "data:text/csv;charset=utf-8," 
         + headers.join(",") + "\n" 
         + filteredData.map((d: any) => `"${d.userName}","${d.userEmail}","${d.tryoutTitle}","${d.completionStatus}","${d.scoreStatus}","${d.paymentMethod === 'none' ? d.resultPlan : d.paymentMethod}","${d.finalScore !== null ? Math.round(d.finalScore) : ''}","${new Date(d.createdAt).toLocaleString('id-ID')}"`).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "GemaSimpulBerdaya_Analytics_Export.csv");
     document.body.appendChild(link);
     link.click();
     link.remove();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-200 fade-in pb-20">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black font-heading text-slate-800 tracking-tight flex items-center gap-2">
            Status Pengerjaan & Analytics
            {isRefetching && <RefreshCw size={22} className="animate-spin text-orange-500" />}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Pantau status penyelesaian ujian, rilis skor, tipe transaksi, dan hasil global dari seluruh partisipan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-sm"
          >
            <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
            Muat Ulang
          </button>
          <button
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-sm shadow-emerald-200 text-sm"
          >
            <Download size={16} />
            Export CSV ({filteredData.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 size={40} className="animate-spin text-orange-500/50" />
        </div>
      ) : isError ? (
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-200 font-medium">Gagal memuat data dari server. Silakan muat ulang.</div>
      ) : (
        <>
          {/* KPI overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
             <div className="bg-white p-6 rounded-2xl border-l-[6px] border-l-blue-500 shadow-sm border border-slate-200 relative overflow-hidden group">
                <div className="absolute top-5 right-5 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={48} className="text-blue-500"/></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status Pengerjaan</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black font-heading text-slate-800">{totalSelesai}</h3>
                   <span className="text-sm font-semibold text-slate-500">/ {filteredData.length}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 w-max px-2.5 py-1 rounded-md">
                   <CheckCircle size={12}/> Telah Selesai Submit
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border-l-[6px] border-l-emerald-500 shadow-sm border border-slate-200 relative overflow-hidden group">
                <div className="absolute top-5 right-5 opacity-10 group-hover:opacity-20 transition-opacity"><PieChartIcon size={48} className="text-emerald-500"/></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Distribusi Nilai</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black font-heading text-emerald-600">{totalRilis}</h3>
                   <span className="text-sm font-semibold text-slate-500">Skor Rilis</span>
                </div>
                <div className="mt-3 flex gap-2">
                   <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md"><CheckCircle className="text-emerald-500" size={10}/> {passCount} Aman {'>'}500</span>
                   <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md"><XCircle className="text-red-500" size={10}/> {totalRilis - passCount} Kritis</span>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border-l-[6px] border-l-orange-500 shadow-sm border border-slate-200 relative overflow-hidden group">
                <div className="absolute top-5 right-5 opacity-10 group-hover:opacity-20 transition-opacity"><CreditCard size={48} className="text-orange-500"/></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Metode Akses (Bayar)</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black font-heading text-slate-800">{paymentMethodCount['voucher'] || 0}</h3>
                   <span className="text-sm font-semibold text-slate-500">Voucher</span>
                </div>
                <div className="mt-3 flex gap-2">
                   <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">{paymentMethodCount['qris'] || paymentMethodCount['paid'] || 0} QRIS/Paid</span>
                   <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md mb-2">{paymentMethodCount['free'] || 0} Free</span>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border-l-[6px] border-l-fuchsia-500 shadow-sm border border-slate-200 relative overflow-hidden group">
                <div className="absolute top-5 right-5 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={48} className="text-fuchsia-500"/></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rata-rata Final ({tryoutFilter === 'all' ? 'Global' : 'Filter'})</p>
                <h3 className="text-4xl font-black font-heading text-fuchsia-600 mt-1">{Math.round(avgFilteredScore)}</h3>
                <div className="mt-3 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md w-max border border-slate-100">
                   Berdasarkan {totalRilis} skor yang dirilis
                </div>
             </div>
          </div>

          <div className="bg-white border flex flex-col xl:flex-row gap-4 p-5 rounded-2xl border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari user, email, atau tryout spesifik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-xl outline-none border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-sm"
              />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-1 xl:pb-0 hide-scrollbar">
              <div className="relative shrink-0 min-w-[220px]">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={tryoutFilter}
                  onChange={(e) => setTryoutFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 appearance-none text-sm transition-shadow cursor-pointer"
                >
                  <option value="all">Semua Paket Tryout</option>
                  {availableTryouts.map((t: any) => (
                    <option key={String(t)} value={String(t)}>{String(t)}</option>
                  ))}
                </select>
              </div>

              <div className="relative shrink-0 min-w-[200px]">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 appearance-none text-sm transition-shadow cursor-pointer"
                >
                  <option value="all">Semua Pembayaran</option>
                  <option value="free">Gratis</option>
                  <option value="voucher">Voucher Khusus</option>
                  <option value="paid">Berbayar</option>
                  <option value="qris">QRIS / Online</option>
                </select>
              </div>

              <div className="relative shrink-0 min-w-[200px]">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 appearance-none text-sm transition-shadow cursor-pointer"
                >
                  <option value="all">Semua Status Rilis</option>
                  <option value="released">Sudah Rilis Skor</option>
                  <option value="waiting">Menunggu IRT</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap table-fixed">
                <thead className="bg-[#f8fcfb] border-b border-slate-200 text-slate-700 uppercase tracking-wider text-xs font-bold font-head">
                  <tr>
                    <th className="px-6 py-4 w-[280px]">Data Peserta</th>
                    <th className="px-6 py-4 w-[220px]">Paket Tryout</th>
                    <th className="px-6 py-4 w-[170px] text-center">Status Mengerjakan</th>
                    <th className="px-6 py-4 w-[170px] text-center">Rilis Skor</th>
                    <th className="px-6 py-4 w-[150px] text-center">Tipe Hak Akses</th>
                    <th className="px-6 py-4 w-[100px] text-right">Skor IRT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.map((row: any) => (
                      <tr
                        key={row.id}
                        className="hover:bg-orange-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                           <div className="font-bold font-heading text-slate-900 text-sm truncate">{row.userName}</div>
                           <div className="text-[11px] text-slate-500 mt-0.5 truncate">{row.userEmail}</div>
                           <div className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(row.createdAt).toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="font-black text-slate-700 text-xs border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-md">{row.tryoutTitle}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide
                              ${row.completionStatus === 'Selesai' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                              {row.completionStatus === 'Selesai' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                              {row.completionStatus}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide
                              ${row.scoreStatus === 'Sudah Rilis' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                              {row.scoreStatus === 'Sudah Rilis' ? <CheckCircle size={14} /> : <Loader2 size={14} className="animate-spin" />}
                              {row.scoreStatus}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-widest uppercase
                              ${row.paymentMethod === 'free' || row.resultPlan === 'free' ? 'bg-slate-100 text-slate-600' : 
                                row.paymentMethod === 'voucher' ? 'bg-yellow-100 text-yellow-800' : 'bg-teal-100 text-teal-800'}`}>
                              {row.paymentMethod === 'voucher' ? <Ticket size={12} /> : row.paymentMethod === 'free' || row.resultPlan === 'free' ? <CheckCircle size={12}/> : <CreditCard size={12} />}
                              {row.paymentMethod === "none" ? row.resultPlan : row.paymentMethod}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {row.finalScore !== null && row.finalScore !== undefined ? (
                              <span className={`font-black text-lg ${row.finalScore >= 500 ? 'text-emerald-600' : 'text-red-500'}`}>
                                 {Math.round(row.finalScore)}
                              </span>
                           ) : (
                              <span className="font-semibold text-slate-400 text-xs italic text-center block bg-slate-50 border border-slate-100 rounded p-1 whitespace-nowrap blur-[1px]">---</span>
                           )}
                        </td>
                      </tr>
                    ))}
                  
                  {filteredData.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Search size={24} className="text-slate-400"/></div>
                              <p className="text-slate-500 font-bold text-base">Data Tidak Ditemukan</p>
                              <p className="text-slate-400 text-xs font-medium">Tidak ada data pengerjaan yang cocok dengan kombinasi pencarian dan filter saat ini.</p>
                           </div>
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-semibold text-slate-500">
               <p>Menampilkan {filteredData.length} baris data</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
