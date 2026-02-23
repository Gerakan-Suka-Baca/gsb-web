"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, BarChart3, Clock } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface Props {
  tryoutId: string;
  plan: "free" | "paid";
  onChangePlan: () => void;
  onViewScores: () => void;
}

export const TryoutThankYou = ({ tryoutId, plan, onChangePlan, onViewScores }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();

  // Prefetch score results — used to conditionally show "Lihat Skor"
  const { data: scoreData, isLoading: isScoreLoading } = useQuery(
    trpc.tryouts.getScoreResults.queryOptions({ tryoutId })
  );

  const hasScores = scoreData?.released === true && scoreData.scores !== null;
  const isNotReleased = !scoreData?.released;
  const releaseDate = scoreData?.releaseDate
    ? new Date(scoreData.releaseDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto py-20 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 bg-gsb-tosca/10 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl"
      >
        🎉
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-responsive-maroon mb-4">
        Terima Kasih Sudah Mengikuti Tryout GSB!
      </h1>

      <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto leading-relaxed">
        {plan === "paid" ? (
          <>
            Pembayaran Anda sedang diverifikasi. Silakan menunggu{" "}
            <span className="font-bold text-foreground">hasil dan pembahasan</span>{" "}
            yang akan disediakan setelah verifikasi selesai.
          </>
        ) : (
          "Nilai akan muncul setelah periode tryout berakhir. Silahkan cek berkala di halaman Dashboard Tryout."
        )}
      </p>

      {/* Score status indicator */}
      {!isScoreLoading && isNotReleased && releaseDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-sm text-gsb-orange bg-gsb-orange/10 px-5 py-3 rounded-full border border-gsb-orange/20 mx-auto mb-6 w-fit"
        >
          <Clock className="w-4 h-4" />
          <span>Skor dirilis: <span className="font-bold">{releaseDate} WIB</span></span>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* "Lihat Skor" — hanya muncul kalau released + ada skor */}
        {hasScores && (
          <Button
            onClick={onViewScores}
            className="bg-gsb-tosca hover:bg-gsb-tosca/90 text-white font-bold h-12 px-8 rounded-full shadow-md gap-2"
            size="lg"
          >
            <BarChart3 className="w-5 h-5" />
            Lihat Skor
          </Button>
        )}

        <Button
          onClick={() => router.push("/tryout")}
          variant="outline"
          className="font-semibold gap-2 rounded-full h-12 px-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Dashboard Tryout
        </Button>

        {plan === "free" && (
          <Button
            onClick={onChangePlan}
            variant="outline"
            className="font-semibold gap-2 rounded-full h-12 px-6"
          >
            <RefreshCw className="w-4 h-4" />
            Upgrade ke Premium
          </Button>
        )}
      </div>
    </motion.div>
  );
};
