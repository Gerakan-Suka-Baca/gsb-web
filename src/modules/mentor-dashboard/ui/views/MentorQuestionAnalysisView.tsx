"use client";

import { Fragment, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Filter,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/ui/RichText";

type AnalysisOption = {
  id?: string;
  content?: unknown;
  isCorrect?: boolean;
};

type AnalysisQuestion = {
  questionId: string;
  questionNumber: number;
  correct: number;
  wrong: number;
  total: number;
  correctness: number;
  content?: unknown;
  image?: { url?: string } | null;
  options?: AnalysisOption[];
};

type AnalysisSummary = {
  totalAttempts?: number;
  overallAverageCorrectness?: number;
  hardestPerSubtest?: Array<{ subtest?: string; questionNumber?: number; correctness?: number }>;
  easiestPerSubtest?: Array<{ subtest?: string; questionNumber?: number; correctness?: number }>;
};

export const MentorQuestionAnalysisView = () => {
  const trpc = useTRPC();
  const [selectedTryoutId, setSelectedTryoutId] = useState<string>("");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [expandedSubtests, setExpandedSubtests] = useState<Record<string, boolean>>({});

  // 1. Fetch available tryouts for the filter selector
  const { data: tryoutsData } = useQuery(
    trpc.tryouts.getMany.queryOptions({ year: null })
  );

  const tryouts = tryoutsData?.docs || [];

  // 2. Fetch per-question analysis for the selected tryout
  const { data: analysisData, isLoading: isLoadingAnalysis } = useQuery({
    ...trpc.mentor.getQuestionAnalysis.queryOptions({ tryoutId: selectedTryoutId }),
    enabled: !!selectedTryoutId,
    staleTime: 5 * 60 * 1000,
  });

  const summary = (analysisData?.summary || {}) as AnalysisSummary;
  const analysisBySubtest = (analysisData?.analysisBySubtest || {}) as Record<
    string,
    AnalysisQuestion[]
  >;

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleSubtest = (subtestName: string) => {
    setExpandedSubtests(prev => ({ ...prev, [subtestName]: !prev[subtestName] }));
  };

  const expandAllSubtest = (_subtestName: string, questions: AnalysisQuestion[]) => {
    const newExpands = { ...expandedQuestions };
    questions.forEach(q => {
      newExpands[q.questionId] = true;
    });
    setExpandedQuestions(newExpands);
  };

  const collapseAllSubtest = (_subtestName: string, questions: AnalysisQuestion[]) => {
    const newExpands = { ...expandedQuestions };
    questions.forEach(q => {
      newExpands[q.questionId] = false;
    });
    setExpandedQuestions(newExpands);
  };

  const expandAllGeneral = () => {
    const newExpands: Record<string, boolean> = {};
    Object.values(analysisBySubtest).forEach((questions) => {
      questions.forEach((q) => {
        newExpands[q.questionId] = true;
      });
    });
    setExpandedQuestions(newExpands);
  };

  const collapseAllGeneral = () => {
    setExpandedQuestions({});
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & tryout filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-responsive-maroon">Analisis Butir Soal</h1>
          <p className="text-muted-foreground">Analisis mendalam performa siswa per nomor soal.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-border">
            <div className="flex items-center gap-2 px-3 text-sm font-medium text-muted-foreground border-r pr-4">
              <Filter className="w-4 h-4" /> Pilih Paket:
            </div>
            <Select value={selectedTryoutId} onValueChange={setSelectedTryoutId}>
              <SelectTrigger className="w-full md:w-[250px] border-none shadow-none focus:ring-0 h-10 font-medium">
                <SelectValue placeholder="Pilih Paket Tryout..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {tryouts.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedTryoutId ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gsb-orange/10 rounded-full flex items-center justify-center mb-4">
               <TrendingUp className="w-8 h-8 text-gsb-orange" />
            </div>
            <h3 className="text-xl font-bold">Belum Ada Data Terpilih</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Silakan pilih salah satu paket tryout di atas untuk melihat analisis butir soal.</p>
          </CardContent>
        </Card>
      ) : isLoadingAnalysis ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
           </div>
           <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Summary statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-none shadow-sm bg-gsb-orange/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gsb-orange uppercase tracking-wider">Total Peserta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                   <div className="text-3xl font-bold">{summary?.totalAttempts}</div>
                   <Users className="w-8 h-8 text-gsb-orange/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Siswa yang menyelesaikan tryout</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 uppercase tracking-wider">Rata-rata Ketepatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                   <div className="text-3xl font-bold text-green-700">{summary?.overallAverageCorrectness}%</div>
                   <CheckCircle2 className="w-8 h-8 text-green-700/30" />
                </div>
                <Progress value={summary?.overallAverageCorrectness} className="h-1.5 mt-3 bg-green-200" indicatorClassName="bg-green-600" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-red-50">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 uppercase tracking-wider">Soal Paling Sulit</CardTitle>
               </CardHeader>
               <CardContent>
                  {summary?.hardestPerSubtest?.[0] ? (
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="bg-red-600">Terendah: {summary.hardestPerSubtest[0].correctness}%</Badge>
                       </div>
                       <p className="text-xs font-medium text-red-800 truncate mt-1">
                          {summary.hardestPerSubtest[0].subtest} - No. {summary.hardestPerSubtest[0].questionNumber}
                       </p>
                    </div>
                  ) : "-"}
               </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-blue-50">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">Soal Paling Mudah</CardTitle>
               </CardHeader>
               <CardContent>
                  {summary?.easiestPerSubtest?.[0] ? (
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600">Tertinggi: {summary.easiestPerSubtest[0].correctness}%</Badge>
                       </div>
                       <p className="text-xs font-medium text-blue-800 truncate mt-1">
                          {summary.easiestPerSubtest[0].subtest} - No. {summary.easiestPerSubtest[0].questionNumber}
                       </p>
                    </div>
                  ) : "-"}
               </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Kontrol tampilan semua subtest</p>
            <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllGeneral}
              className="rounded-full border-gsb-orange text-gsb-orange hover:bg-gsb-orange/10"
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Expand Semua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAllGeneral}
              className="rounded-full border-muted-foreground/30 text-muted-foreground hover:bg-muted"
            >
              <Minimize2 className="w-3.5 h-3.5 mr-1.5" /> Collapse Semua
            </Button>
            </div>
          </div>

          {/* Detailed per-subtest question analysis table */}
          <div className="space-y-8">
            {Object.entries(analysisBySubtest).map(([subtestName, questions]) => (
              <Card key={subtestName} className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-accent/30 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 hover:bg-transparent"
                        onClick={() => toggleSubtest(subtestName)}
                      >
                        {expandedSubtests[subtestName] ? (
                          <ChevronUp className="w-5 h-5 text-responsive-maroon" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-responsive-maroon" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="text-xl text-responsive-maroon">{subtestName}</CardTitle>
                        <CardDescription>Analisis performa per nomor soal ({questions.length} soal)</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 mr-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => expandAllSubtest(subtestName, questions)}
                          className="h-8 text-xs text-gsb-orange hover:text-gsb-orange hover:bg-gsb-orange/10 px-2"
                        >
                          Expand All
                        </Button>
                        <span className="text-muted-foreground/30">|</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => collapseAllSubtest(subtestName, questions)}
                          className="h-8 text-xs text-muted-foreground hover:bg-muted px-2"
                        >
                          Collapse All
                        </Button>
                      </div>
                        <Badge variant="outline" className="bg-white px-3 py-1">
                        Avg: {Math.round((questions.reduce((acc, curr) => acc + curr.correctness, 0) / questions.length) * 10) / 10}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {!expandedSubtests[subtestName] && (
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-accent/10">
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead className="w-[80px] font-bold">No</TableHead>
                          <TableHead className="font-bold">Visualisasi Ketepatan</TableHead>
                          <TableHead className="text-center font-bold">Benar</TableHead>
                          <TableHead className="text-center font-bold">Salah</TableHead>
                          <TableHead className="text-center font-bold">Total</TableHead>
                          <TableHead className="text-right font-bold">% Benar</TableHead>
                          <TableHead className="w-[100px] text-right font-bold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((q) => {
                          const isKiller = q.correctness < 30;
                          const isEasy = q.correctness > 70;
                          const isExpanded = expandedQuestions[q.questionId];
                          
                          return (
                            <Fragment key={q.questionId}>
                              <TableRow 
                                key={q.questionId} 
                                className={cn(
                                  "hover:bg-accent/5 cursor-pointer transition-colors",
                                  isExpanded && "bg-gsb-orange/[0.02]"
                                )}
                                onClick={() => toggleQuestion(q.questionId)}
                              >
                                <TableCell>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold"># {q.questionNumber}</TableCell>
                                <TableCell className="min-w-[200px]">
                                   <div className="flex items-center gap-3">
                                      <Progress 
                                        value={q.correctness} 
                                        className="h-2 flex-1" 
                                        indicatorClassName={cn(
                                          isKiller ? "bg-red-500" : isEasy ? "bg-green-500" : "bg-gsb-orange"
                                        )}
                                      />
                                   </div>
                                </TableCell>
                                <TableCell className="text-center text-green-600 font-medium">{q.correct}</TableCell>
                                <TableCell className="text-center text-red-500 font-medium">{q.wrong}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{q.total}</TableCell>
                                <TableCell className="text-right font-bold">{q.correctness}%</TableCell>
                                <TableCell className="text-right">
                                   {isKiller ? (
                                     <Badge variant="destructive" className="bg-red-600 flex items-center gap-1 w-fit ml-auto">
                                       <AlertTriangle className="w-3 h-3" /> Killer
                                     </Badge>
                                   ) : isEasy ? (
                                     <Badge className="bg-green-600 flex items-center gap-1 w-fit ml-auto">
                                       <CheckCircle2 className="w-3 h-3" /> Easy
                                     </Badge>
                                   ) : (
                                     <Badge variant="secondary" className="flex items-center gap-1 w-fit ml-auto">
                                       Normal
                                     </Badge>
                                   )}
                                </TableCell>
                              </TableRow>
                              
                              {isExpanded && (
                                <TableRow className="bg-gsb-orange/[0.02] hover:bg-gsb-orange/[0.02] border-none">
                                  <TableCell colSpan={8} className="p-6">
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gsb-orange/10 space-y-6">
                                      {/* Question content preview */}
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gsb-orange uppercase tracking-wider flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-gsb-orange" /> Isi Soal
                                        </h4>
                                        <div className="prose prose-sm max-w-none">
                                          {q.content ? (
                                            <RichText content={q.content} />
                                          ) : (
                                            <p className="text-muted-foreground italic">Konten soal tidak tersedia.</p>
                                          )}
                                        </div>
                                        {q.image && q.image.url && (
                                          <div className="mt-4 rounded-xl overflow-hidden border">
                                            <img 
                                              src={q.image.url} 
                                              alt={`Soal nomor ${q.questionNumber}`}
                                              className="max-h-[400px] object-contain mx-auto"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* Answer option cards */}
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gsb-orange uppercase tracking-wider flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-gsb-orange" /> Pilihan Jawaban
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {q.options && q.options.length > 0 ? (
                                            q.options.map((opt, idx: number) => (
                                              <div 
                                                key={opt.id}
                                                className={cn(
                                                  "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                                                  opt.isCorrect 
                                                    ? "bg-green-50 border-green-200 ring-1 ring-green-200" 
                                                    : "bg-muted/30 border-border"
                                                )}
                                              >
                                                <div className={cn(
                                                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                  opt.isCorrect 
                                                    ? "bg-green-600 text-white" 
                                                    : "bg-muted text-muted-foreground"
                                                )}>
                                                  {opt.isCorrect ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                                                </div>
                                                <div className="text-sm">
                                                  <RichText content={opt.content} />
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-muted-foreground italic col-span-2">Pilihan jawaban tidak tersedia.</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
