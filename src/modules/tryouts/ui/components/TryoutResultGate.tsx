"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ShieldCheck, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  fullName: string;
  tryoutTitle: string;
  onPlanSelected: (plan: "free" | "paid") => void;
  isUpgrading?: boolean;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const TryoutResultGate = ({ tryoutId, attemptId, username, fullName, tryoutTitle, onPlanSelected, isUpgrading }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"free" | "paid" | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const updatePlanMutation = useMutation(
    trpc.tryoutAttempts.updatePlan.mutationOptions({
      onSuccess: async () => {
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
    } else {
      setShowPaymentDialog(true);
    }
  };

  useEffect(() => {
    if (!isUpgrading) return;
    setSelectedPlan("paid");
    setShowPaymentDialog(true);
  }, [isUpgrading]);

  const handleWAConfirm = () => {
    const message = encodeURIComponent(
      `Halo Admin GSB, saya ${fullName} (@${username}) sudah melakukan pembayaran untuk Tryout SNBT Premium ${tryoutTitle} sebesar Rp 5.000. Mohon verifikasi. (Mohon sertakan bukti transfer)`
    );
    window.open(`https://wa.me/6285156423290?text=${message}`, "_blank");
    
    setShowPaymentDialog(false);
    updatePlanMutation.mutate({ attemptId, plan: "paid" });
  };

  return (
    <motion.div {...fadeUp} className="max-w-5xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 bg-gsb-tosca/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
        >
          🎉
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gsb-maroon mb-4">
          {selectedPlan === 'free' ? "Terima kasih" : "Selamat! Anda Telah Menyelesaikan Tryout"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Perjalanan pejuang PTN belum berakhir. Pilih opsi di bawah untuk
          melihat hasil analisis mendalam kemampuan Anda.
        </p>
      </div>

      {!isUpgrading && (
      <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`p-8 border-2 cursor-pointer transition-all duration-300 rounded-2xl h-full ${
              selectedPlan === "free"
                ? "border-gsb-blue bg-gsb-blue/10 shadow-xl"
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
                <Check className="w-5 h-5 text-gsb-tosca shrink-0" />
                <span>Skor Keluar H+7</span>
                <span className="text-xs bg-gsb-yellow/20 text-gsb-yellow px-2 py-0.5 rounded-full ml-auto">Nilai H+7</span>
              </li>
              <li className="flex gap-3 items-center text-base">
                <Check className="w-5 h-5 text-gsb-tosca shrink-0" />
                <span>Ranking Nasional</span>
              </li>
              {/* <li className="flex gap-3 items-center text-base text-muted-foreground/50">
                <XIcon className="w-5 h-5 shrink-0" />
                <span>Tidak Ada Pembahasan</span>
              </li> */}
              <li className="text-sm text-muted-foreground mt-4 italic border-t pt-4">
                 Silahkan Cek Berkala di halaman Dashboard Tryout ini.
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
                ? "border-gsb-orange bg-gsb-orange/5 shadow-xl ring-2 ring-gsb-orange/10"
                : "border-gsb-orange/30 hover:border-gsb-orange hover:shadow-lg"
            }`}
            onClick={() => handleSelectPlan("paid")}
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
                <Check className="w-5 h-5 text-gsb-tosca shrink-0" />
                <span className="font-medium">Skor Langsung Keluar</span>
              </li>
              <li className="flex gap-3 items-center text-base bg-gsb-orange/5 p-2 -ml-2 rounded-lg border border-gsb-orange/10">
                <ShieldCheck className="w-5 h-5 text-gsb-orange shrink-0" />
                <b className="text-gsb-orange">Pembahasan Lengkap (Dalam bentuk PDF)</b>
              </li>
            </ul>
            <Button
              className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white h-12 text-lg font-bold rounded-xl shadow-md"
              variant="default"
              onClick={(e) => {
                 e.stopPropagation();
                 handleSelectPlan("paid");
              }}
            >
              Pilih Premium
            </Button>
          </Card>
        </motion.div>
      </div>
      )}

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Instruksi Pembayaran</DialogTitle>
                <DialogDescription>
                    Scan QRIS di bawah ini untuk mengaktifkan paket Premium.
                </DialogDescription>
            </DialogHeader>

             <div className="grid md:grid-cols-2 gap-8 items-center mt-4">
              <div className="flex justify-center bg-muted/50 p-4 rounded-lg">
                <div className="relative w-64 aspect-[3/4]">
                  <Image
                    src="/home/qris.jpeg"
                    alt="QRIS GSB"
                    fill
                    sizes="(max-width: 768px) 80vw, 256px"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Scan QRIS di samping menggunakan GoPay, OVO, Dana, ShopeePay,
                    atau Mobile Banking apa pun.
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Nominal Transfer</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-mono font-bold text-gsb-orange">Rp 5.000</p>
                  </div>
                </div>

                <Button
                  onClick={handleWAConfirm}
                  className="w-full bg-gsb-tosca hover:bg-gsb-tosca/90 text-white font-bold h-12 gap-2"
                  disabled={updatePlanMutation.isPending}
                >
                  <MessageCircle className="w-5 h-5" />
                  {updatePlanMutation.isPending ? "Memproses..." : "Konfirmasi via WhatsApp"}
                </Button>
              </div>
            </div>
            
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

