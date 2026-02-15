"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ShieldCheck, MessageCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
} as const;

interface Props {
  tryoutId: string;
  attemptId: string;
  username: string;
  onPlanSelected: (plan: "free" | "paid") => void;
}

export const TryoutResultGate = ({ tryoutId, attemptId, username, onPlanSelected }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"free" | "paid" | null>(null);
  const [waClicked, setWaClicked] = useState(false);

  const updatePlanMutation = useMutation(
    trpc.tryoutAttempts.updatePlan.mutationOptions({
      onSuccess: async () => {
        // Invalidate specific attempt query using tryoutId
        await queryClient.invalidateQueries({ 
            queryKey: [["tryoutAttempts", "getAttempt"], { input: { tryoutId }, type: "query" }] 
        });
        
        toast.success("Paket berhasil disimpan!");
        if (selectedPlan) onPlanSelected(selectedPlan);
      },
      onError: (err) => toast.error("Gagal menyimpan paket: " + err.message),
    })
  );

  const handleSelectPlan = (plan: "free" | "paid") => {
    setSelectedPlan(plan);
    if (plan === "free") {
      updatePlanMutation.mutate({ attemptId, plan: "free" });
    }
  };

  const handleWAConfirm = () => {
    const message = encodeURIComponent(
      `Halo Admin GSB, saya (${username}) sudah melakukan pembayaran untuk Tryout SNBT Premium sebesar Rp 5.020. Mohon verifikasi. (Mohon sertakan bukti transfer)`
    );
    window.open(`https://wa.me/6285156423290?text=${message}`, "_blank");
    setWaClicked(true);
  };

  const handlePaidConfirm = () => {
    updatePlanMutation.mutate({ attemptId, plan: "paid" });
  };

  return (
    <motion.div {...fadeUp} className="max-w-5xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
        >
          🎉
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gsb-maroon mb-4">
          Selamat! Anda Telah Menyelesaikan Tryout
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Perjalanan pejuang PTN belum berakhir. Pilih opsi di bawah untuk
          melihat hasil analisis mendalam kemampuan Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`p-8 border-2 cursor-pointer transition-all duration-300 rounded-2xl h-full ${
              selectedPlan === "free"
                ? "border-gsb-blue bg-blue-50/20 shadow-xl"
                : "border-gray-200 hover:border-gsb-blue/30 hover:shadow-lg"
            }`}
            onClick={() => handleSelectPlan("free")}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold text-gsb-blue">Akses Gratis</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <p className="text-4xl font-bold text-foreground">Rp 0</p>
                <span className="text-muted-foreground font-medium">/ tryout</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 items-center text-base">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Skor Keluar H+7</span>
              </li>
              <li className="flex gap-3 items-center text-base">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Ranking Nasional</span>
              </li>
              <li className="flex gap-3 items-center text-base text-muted-foreground/50">
                <XIcon className="w-5 h-5 shrink-0" />
                <span>Tidak Ada Pembahasan</span>
              </li>
            </ul>
            <Button
              className="w-full h-12 text-lg font-bold rounded-xl"
              variant={selectedPlan === "free" ? "default" : "outline"}
              disabled={updatePlanMutation.isPending}
            >
              {selectedPlan === "free" && updatePlanMutation.isPending ? "Menyimpan..." : "Pilih Gratis"}
            </Button>
          </Card>
        </motion.div>


        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`relative p-8 border-2 cursor-pointer transition-all duration-300 rounded-2xl h-full ${
              selectedPlan === "paid"
                ? "border-gsb-orange bg-orange-50/20 shadow-xl ring-2 ring-gsb-orange/10"
                : "border-gsb-orange/30 hover:border-gsb-orange hover:shadow-lg"
            }`}
            onClick={() => setSelectedPlan("paid")}
          >
            <div className="absolute top-0 right-0 bg-gsb-orange text-white text-sm px-4 py-1.5 rounded-bl-2xl rounded-tr-xl font-bold tracking-wide shadow-sm">
              RECOMMENDED
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold text-gsb-orange">Akses Premium</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <p className="text-4xl font-bold text-foreground">Rp 5.000</p>
                <span className="text-muted-foreground font-medium">/ tryout</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 items-center text-base">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span className="font-medium">Skor Langsung Keluar</span>
              </li>
              <li className="flex gap-3 items-center text-base bg-orange-50 p-2 -ml-2 rounded-lg border border-orange-100">
                <ShieldCheck className="w-5 h-5 text-gsb-orange shrink-0" />
                <b className="text-gsb-orange">Pembahasan Lengkap (Dalam bentuk PDF)</b>
              </li>
            </ul>
            <Button
              className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white h-12 text-lg font-bold rounded-xl shadow-md"
              variant="default"
            >
              Pilih Premium
            </Button>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {selectedPlan === "paid" && (
          <motion.div key="paid" {...fadeUp} className="bg-white p-8 rounded-xl border border-border shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
                <div className="relative w-64 aspect-[3/4]">
                  <Image src="/home/qris.jpeg" alt="QRIS GSB" fill className="object-contain" />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Instruksi Pembayaran</h3>
                  <p className="text-muted-foreground text-sm">
                    Scan QRIS di samping menggunakan GoPay, OVO, Dana, ShopeePay,
                    atau Mobile Banking apa pun.
                  </p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Nominal Transfer</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-mono font-bold text-gsb-orange">Rp 5.020</p>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200">Kode Unik: 020</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    *Mohon transfer tepat hingga 3 digit terakhir agar verifikasi otomatis.
                  </p>
                </div>

                <Button
                  onClick={handleWAConfirm}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Konfirmasi via WhatsApp
                </Button>

                <AnimatePresence>
                  {waClicked && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <Button
                        onClick={handlePaidConfirm}
                        className="w-full bg-gsb-blue hover:bg-gsb-blue/90 text-white font-bold h-12 gap-2"
                        size="lg"
                        disabled={updatePlanMutation.isPending}
                      >
                        <ArrowLeft className="w-5 h-5" />
                        {updatePlanMutation.isPending ? "Menyimpan..." : "Klik Disini Jika Sudah Konfirmasi"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
