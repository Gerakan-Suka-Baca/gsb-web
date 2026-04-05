"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { MentorDashboardHeader } from "../components/MentorDashboardHeader";
import { MentorDashboardWidgets } from "../components/MentorDashboardWidgets";
import { MentorDashboardFilters } from "../components/MentorDashboardFilters";
import { MentorStudentTable } from "../components/MentorStudentTable";
import { MentorStudentModal } from "../components/MentorStudentModal";

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
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Fetch all dashboard data
  const queryOptions = trpc.mentor.getDashboardData.queryOptions({});
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(queryOptions);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-primary space-y-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-medium animate-pulse text-lg">Memuat Data Siswa ...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-red-500">
        <p className="border border-red-500/30 bg-red-500/10 p-4 rounded-xl flex items-center gap-3">
           <span className="text-xl">⚠️</span> Gagal mengambil data. Server Payload mungkin timeout.
        </p>
      </div>
    );
  }

  const exportToCSV = () => {
    if (!data) return;

    let headers = [
      "Nama Siswa", "Email", "Telepon", "Sekolah", "Paket Tryout", 
      "Skor PU", "Skor PK", "Skor PM", "Skor LBE", "Skor LBI", "Skor PPU", "Skor KMBM", "Skor Global UTBK",
      "Pilihan 1 (Univ)", "Pilihan 1 (Jurusan)", "Passing Grade 1", "Peluang 1", "Rekomendasi 1",
      "Pilihan 2 (Univ)", "Pilihan 2 (Jurusan)", "Passing Grade 2", "Peluang 2", "Rekomendasi 2",
      "Opsi Cadangan 1", "Opsi Cadangan 2", "Opsi Cadangan 3", "Opsi Cadangan 4", "Opsi Cadangan 5"
    ];

    let rows = data.map(row => {
      const a = row.analysis;
      return [
        `"${row.user.fullName}"`,
        `"${row.user.email}"`,
        `"${row.user.whatsapp || ""}"`,
        `"${row.user.schoolOrigin || ""}"`,
        `"${row.tryout.title}"`,
        row.scoreDetails.score_PU, row.scoreDetails.score_PK, row.scoreDetails.score_PM,
        row.scoreDetails.score_LBE, row.scoreDetails.score_LBI, row.scoreDetails.score_PPU, row.scoreDetails.score_KMBM,
        row.scoreDetails.finalScore,
        `"${a.choice1?.targetPTN || a.choice1?.dbUnivName || ""}"`, `"${a.choice1?.targetMajor || a.choice1?.dbMajorName || ""}"`, a.choice1?.passingGrade || 0, `"${a.choice1?.chance || 0}%"`, `"${a.choice1?.level || ""}"`,
        `"${a.choice2?.targetPTN || a.choice2?.dbUnivName || ""}"`, `"${a.choice2?.targetMajor || a.choice2?.dbMajorName || ""}"`, a.choice2?.passingGrade || 0, `"${a.choice2?.chance || 0}%"`, `"${a.choice2?.level || ""}"`,
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
        return "bg-green-500 hover:bg-green-600 text-white border-transparent";
      case "Kompetitif":
        return "bg-amber-500 hover:bg-amber-600 text-white border-transparent";
      case "Risiko":
      case "Sangat Sulit":
        return "bg-red-500 hover:bg-red-600 text-white border-transparent";
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
        const level = row.analysis?.choice1?.level || "";
        const isSafe = level.includes("Aman");
        const isCompetitive = level === "Kompetitif";
        const isRisk = level.includes("Risiko") || level.includes("Sulit");
        
        if (passingFilter === "SAFE" && !isSafe) matchPassing = false;
        if (passingFilter === "COMPETITIVE" && !isCompetitive) matchPassing = false;
        if (passingFilter === "RISK" && !isRisk) matchPassing = false;
     }

     return matchSearch && matchTryout && matchPassing;
  });

  const openStudentModal = (studentData: any) => {
     const history = data?.filter(d => d.user.id === studentData.user.id)
       .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [];
     setSelectedStudent({ ...studentData, history });
     setIsModalOpen(true);
  }

  // Calculate Global Analytics
  const totalScores = filteredData?.length || 0;
  const avgScore = totalScores > 0 ? filteredData!.reduce((acc, curr) => acc + curr.scoreDetails.finalScore, 0) / totalScores : 0;
  const passedStudents = filteredData?.filter(d => d.scoreDetails.finalScore > 500).length || 0;
  const passRate = totalScores > 0 ? (passedStudents / totalScores) * 100 : 0;
  
  let hardestSubject = { name: "-", avg: 0 };
  if (totalScores > 0) {
     const subtestAvgs = [
        { name: "Penalaran Umum", key: "score_PU" },
        { name: "Pengetahuan Kuant", key: "score_PK" },
        { name: "Penalaran MTK", key: "score_PM" },
        { name: "Literasi B. Ing", key: "score_LBE" },
        { name: "Literasi B. Ind", key: "score_LBI" },
        { name: "Pengetahuan Umum", key: "score_PPU" },
        { name: "Kemampuan Baca", key: "score_KMBM" }
     ].map(sub => {
        const avg = filteredData!.reduce((acc, curr) => acc + (curr.scoreDetails[sub.key as keyof typeof curr.scoreDetails] as number || 0), 0) / totalScores;
        return { name: sub.name, avg };
     });
     subtestAvgs.sort((a, b) => a.avg - b.avg);
     if (subtestAvgs.length > 0) hardestSubject = subtestAvgs[0];
  }



  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      
      <MentorDashboardHeader isRefetching={isRefetching} onRefetch={() => refetch()} onExport={exportToCSV} />

      <MentorDashboardWidgets 
         totalScores={totalScores} 
         avgScore={avgScore} 
         passRate={passRate} 
         hardestSubject={hardestSubject} 
         rawFilteredData={filteredData || []} 
         unfilteredData={data || []}
      />

      <MentorDashboardFilters
         searchTerm={searchTerm} setSearchTerm={setSearchTerm}
         tryoutFilter={tryoutFilter} setTryoutFilter={setTryoutFilter}
         passingFilter={passingFilter} setPassingFilter={setPassingFilter}
         availableTryouts={availableTryouts}
      />

      <MentorStudentTable 
         filteredData={filteredData || []} 
         openStudentModal={openStudentModal} 
         getBadgeColor={getBadgeColor} 
      />

      {isModalOpen && (
         <MentorStudentModal 
            selectedStudent={selectedStudent} 
            onClose={() => setIsModalOpen(false)} 
            getBadgeColor={getBadgeColor} 
         />
      )}
    </div>
  );
};
