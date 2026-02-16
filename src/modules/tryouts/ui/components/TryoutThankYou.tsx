"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface Props {
  plan: "free" | "paid";
  onChangePlan: () => void;
}

export const TryoutThankYou = ({ plan, onChangePlan }: Props) => {
  const router = useRouter();

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

      <h1 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-4">
        {plan === 'paid' ? "Terima Kasih Sudah Mengikuti Tryout GSB!" : "Terima Kasih Sudah Mengikuti Tryout GSB!"}
      </h1>

      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
        {plan === "paid" ? (
          <>
            Pembayaran Anda sedang diverifikasi. Silakan menunggu <span className="font-bold text-foreground">hasil dan pembahasan</span> yang akan disediakan setelah verifikasi selesai.
          </>
        ) : (
          "Nilai akan muncul H+7 setelah periode tryout berakhir. Silahkan cek berkala di halaman Dashboard Tryout ini."
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          onClick={() => router.push("/tryout")}
          className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold h-12 px-8 rounded-full shadow-md gap-2"
          size="lg"
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
