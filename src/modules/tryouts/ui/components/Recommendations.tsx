"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props {
  tryoutId: string;
}

export const Recommendations = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  
  const { data, isLoading } = useQuery(
    trpc.tryouts.getRecommendations.queryOptions({ tryoutId })
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-12 px-4"
    >
      <div className="mb-4">
        <Button onClick={() => router.back()} variant="ghost" className="gap-2 -ml-4 hover:bg-muted/50">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Hasil
        </Button>
      </div>

      <div className="text-center mb-10">
         <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="w-10 h-10 text-amber-500" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          Rekomendasi Universitas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Berdasarkan minat program studimu dan skor akhir Tryout kamu (<b>{data.finalScore}</b>), 
          berikut adalah daftar PTN yang secara statistik memiliki peluang lulus <b>Aman</b>.
        </p>
      </div>

      {data.recommendations.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-2">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Belum ada rekomendasi yang sesuai</h3>
          <p className="text-muted-foreground">
            Kami tidak dapat menemukan PTN yang linier dengan minat pilihanmu atau skor kamu belum memenuhi kriteria passing grade aman untuk program terkait saat ini.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations.map((rec: any, idx: number) => {
            let level = "Sangat Sulit";
            let colorClass = "text-red-600 bg-red-50 rounded px-2 py-0.5";

            if (rec.chance >= 85) { 
               level = "Sangat Aman"; 
               colorClass = "text-green-600 bg-green-50 rounded px-2 py-0.5";
            }
            else if (rec.chance >= 70) { 
               level = "Aman";
               colorClass = "text-green-600 bg-green-50 rounded px-2 py-0.5";
            }
            else if (rec.chance >= 50) { 
               level = "Kompetitif"; 
               colorClass = "text-amber-600 bg-amber-50 rounded px-2 py-0.5";
            }
            else if (rec.chance >= 30) {
               level = "Risiko";
               colorClass = "text-rose-600 bg-rose-50 rounded px-2 py-0.5";
            }

            return (
              <Link href={`/program-studi/${rec.id}`} key={idx} className="block h-full group">
                <Card className="p-5 border-border hover:border-primary/40 focus:border-primary/40 transition-all duration-200 bg-card flex flex-col h-full transform group-hover:-translate-y-1 shadow-sm hover:shadow-md cursor-pointer">
                  <div className="flex-1">
                     <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">{rec.name}</h3>
                     <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4 font-medium">
                       <Building2 className="w-4 h-4" />
                       <span className="truncate">{rec.universityName}</span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-muted group-hover:bg-muted/70 transition-colors px-3 py-2 rounded-md">
                           <p className="text-xs text-muted-foreground font-medium mb-0.5">Rata-rata UKT</p>
                           <p className="font-bold text-sm truncate">{rec.avgUkt || "Belum Ada Data"}</p>
                        </div>
                        <div className="bg-muted group-hover:bg-muted/70 transition-colors px-3 py-2 rounded-md">
                           <p className="text-xs text-muted-foreground font-medium mb-0.5">Daya Tampung</p>
                           <p className="font-bold text-sm">{rec.capacity || "-"}</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                     <div>
                       <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status Peluang</p>
                       <p className={`text-sm font-bold ${colorClass}`}>{level}</p>
                     </div>
                     <div className="text-right">
                       <span className={`text-2xl font-black ${rec.chance >= 70 ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500'}`}>{rec.chance}%</span>
                     </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </motion.div>
  );
};
