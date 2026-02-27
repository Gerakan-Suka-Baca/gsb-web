"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Loader2, Clock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { SUBTEST_OPTIONS } from "@/collections/subtestOptions";
import { AdmissionAnalysis } from "@/modules/universitas/ui/components/AdmissionAnalysis";

interface Props {
  tryoutId: string;
}

type SubtestStat = {
  subtestId: string;
  correct: number;
  wrong: number;
  empty: number;
  total: number;
};

type ScoreMap = {
  score_PU?: number | null;
  score_PK?: number | null;
  score_PM?: number | null;
  score_LBE?: number | null;
  score_LBI?: number | null;
  score_PPU?: number | null;
  score_KMBM?: number | null;
};

type ScoreResults = {
  released: boolean;
  releaseDate?: string | null;
  scores?: ScoreMap | null;
  subtestStats: SubtestStat[];
  finalScore?: number | null;
  tryoutTitle?: string;
  totalCorrect?: number;
  totalQuestions?: number;
  subtestDurations?: Record<string, number>;
};

const TPS_CODES = ["PU", "PPU", "PK", "KMBM"];
const LIT_CODES = ["LBI", "LBE", "PM"];

const SUBTEST_COLORS: Record<string, { bg: string; border: string; text: string; bar: string; darkText: string }> = {
  PU:   { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-700",    bar: "bg-blue-500",    darkText: "dark:text-blue-400" },
  PK:   { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500", darkText: "dark:text-emerald-400" },
  PM:   { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  bar: "bg-violet-500",  darkText: "dark:text-violet-400" },
  LBE:  { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   bar: "bg-amber-500",   darkText: "dark:text-amber-400" },
  LBI:  { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    bar: "bg-rose-500",    darkText: "dark:text-rose-400" },
  PPU:  { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    bar: "bg-cyan-500",    darkText: "dark:text-cyan-400" },
  KMBM: { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  bar: "bg-orange-500",  darkText: "dark:text-orange-400" },
};

const DEFAULT_COLOR = { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", bar: "bg-gray-500", darkText: "dark:text-gray-300" };

function getSubtestLabel(code: string): string {
  return SUBTEST_OPTIONS.find((o) => o.value === code)?.label || code;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} dtk`;
  return `${m} mnt ${s} dtk`;
}

export const ScoreDashboard = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();

  const { data, isLoading } = useQuery(
    trpc.tryouts.getScoreResults.queryOptions({ tryoutId })
  );
  const result = data as ScoreResults | undefined;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!result?.released) {
    const releaseDate = result?.releaseDate
      ? new Date(result.releaseDate).toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
        })
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto py-20 px-4 text-center"
      >
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
          Skor Belum Tersedia
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          Tunggu di halaman ini untuk melihat skor Anda. Skor akan dirilis secara serentak untuk semua peserta.
        </p>
        {releaseDate && (
          <p className="text-base font-medium text-amber-600 dark:text-amber-500 bg-amber-500/10 rounded-xl px-6 py-3 inline-block">
            Jadwal rilis: {releaseDate} WIB
          </p>
        )}
        <div className="mt-8">
          <Button onClick={() => router.push("/tryout")} variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!result.scores) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto py-20 px-4 text-center"
      >
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <MinusCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
          Belum Ada Nilai
        </h1>
        <p className="text-lg text-muted-foreground">
          Skor Anda belum diinput oleh panitia. Silakan cek kembali nanti.
        </p>
        <div className="mt-8">
          <Button onClick={() => router.push("/tryout")} variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  const scores = result.scores;
  const statsMap = new Map(result.subtestStats.map((s) => [s.subtestId, s]));
  const totalCorrect = result.totalCorrect ?? 0;
  const totalQuestions = result.totalQuestions ?? 0;
  const totalWrong = totalQuestions - totalCorrect - result.subtestStats.reduce((acc, s) => acc + s.empty, 0);
  const totalEmpty = result.subtestStats.reduce((acc, s) => acc + s.empty, 0);

  const entries = SUBTEST_OPTIONS.map((opt) => {
    const scoreKey = `score_${opt.value}` as keyof ScoreMap;
    const score = scores[scoreKey] ?? null;
    const stats =
      statsMap.get(opt.value) ||
      result.subtestStats.find((s) => s.subtestId.includes(opt.value)) ||
      null;
    const duration = result.subtestDurations?.[opt.value] || 0;

    return {
      code: opt.value,
      label: getSubtestLabel(opt.value),
      score,
      stats,
      duration,
    };
  }).filter((e) => e.score !== null && e.score !== undefined);

  const tpsEntries = entries.filter((e) => TPS_CODES.includes(e.code));
  const litEntries = entries.filter((e) => LIT_CODES.includes(e.code));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-12 px-4"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Trophy className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          Hasil Tryout
        </h1>
        <p className="text-muted-foreground text-lg">{result.tryoutTitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="p-4 text-center bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/20">
          <p className="text-3xl font-bold text-primary">{result.finalScore ?? "—"}</p>
          <p className="text-sm text-muted-foreground font-medium mt-1">Skor Akhir</p>
        </Card>
        <Card className="p-4 text-center dark:bg-card">
          <p className="text-3xl font-bold text-green-600 dark:text-green-500">{totalCorrect}</p>
          <p className="text-sm text-muted-foreground font-medium mt-1">Benar</p>
        </Card>
        <Card className="p-4 text-center dark:bg-card">
          <p className="text-3xl font-bold text-red-500 dark:text-red-400">{totalWrong}</p>
          <p className="text-sm text-muted-foreground font-medium mt-1">Salah</p>
        </Card>
        <Card className="p-4 text-center dark:bg-card">
          <p className="text-3xl font-bold text-gray-500 dark:text-gray-400">{totalEmpty}</p>
          <p className="text-sm text-muted-foreground font-medium mt-1">Kosong</p>
        </Card>
      </div>

      <AdmissionAnalysis tryoutId={tryoutId} />

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 px-1 text-foreground">Rekap Hasil Tryout</h2>
        
        <div className="space-y-6">
          {tpsEntries.length > 0 && (
            <Card className="overflow-hidden border-border dark:bg-card shadow-sm">
              <div className="bg-muted/50 dark:bg-muted/20 px-5 py-3 border-b border-border flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold mr-3">-</span>
                <h3 className="font-bold text-blue-700 dark:text-blue-400 text-lg">Nilai TPS</h3>
              </div>
              <div className="divide-y divide-border">
                {tpsEntries.map((entry) => (
                  <SubtestRow key={entry.code} entry={entry} />
                ))}
              </div>
            </Card>
          )}

          {litEntries.length > 0 && (
            <Card className="overflow-hidden border-border dark:bg-card shadow-sm">
              <div className="bg-muted/50 dark:bg-muted/20 px-5 py-3 border-b border-border flex items-center">
                 <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold mr-3">-</span>
                <h3 className="font-bold text-blue-700 dark:text-blue-400 text-lg">Nilai Literasi</h3>
              </div>
              <div className="divide-y divide-border">
                {litEntries.map((entry) => (
                  <SubtestRow key={entry.code} entry={entry} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Button
          onClick={() => router.push("/tryout")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-full shadow-md gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali ke Dashboard
        </Button>
      </div>
    </motion.div>
  );
};

type ScoreEntry = {
  code: string;
  label: string;
  score: number | null;
  stats: SubtestStat | null;
  duration: number;
};

function SubtestRow({ entry }: { entry: ScoreEntry }) {
  const colors = SUBTEST_COLORS[entry.code] || DEFAULT_COLOR;
  const pct = entry.score ? Math.min((entry.score / 1000) * 100, 100) : 0;

  return (
    <div className="p-3 sm:px-5 flex flex-col gap-2 hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors">
      <div className="flex items-end justify-between">
        <p className={`font-semibold ${colors.text} ${colors.darkText} text-sm sm:text-base leading-tight`}>{entry.label}</p>
        <div className={`text-lg sm:text-xl font-bold ${colors.text} ${colors.darkText} leading-none`}>
          {entry.score ?? "—"}
        </div>
      </div>
      
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
           className={`h-full rounded-full ${colors.bar}`}
           initial={{ width: 0 }}
           animate={{ width: `${pct}%` }}
           transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
        {entry.stats && (
          <div className="flex items-center gap-2.5">
            <span className="flex items-center text-green-600 dark:text-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />{entry.stats.correct}</span>
            <span className="flex items-center text-red-500 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" />{entry.stats.wrong}</span>
            <span className="flex items-center text-gray-500 dark:text-gray-400"><MinusCircle className="w-3 h-3 mr-1" />{entry.stats.empty}</span>
          </div>
        )}
        <span className="flex items-center text-sky-600 dark:text-sky-400 ml-auto">
          <Clock className="w-3 h-3 mr-1" /> {formatDuration(entry.duration)}
        </span>
      </div>
    </div>
  );
}
