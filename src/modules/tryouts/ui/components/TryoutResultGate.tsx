import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export const TryoutResultGate = () => {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "paid" | null>(
    null,
  );

  const handleWAConfirm = () => {
    const message = encodeURIComponent(
      "Halo Admin GSB, saya sudah melakukan pembayaran untuk Tryout SNBT Premium sebesar Rp 5.020. Mohon verifikasi. Terima kasih.",
    );
    window.open(`https://wa.me/6285156423290?text=${message}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-gsb-maroon mb-4">
          Selamat! Anda Telah Menyelesaikan Tryout
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Perjalanan pejuang PTN belum berakhir. Pilih opsi di bawah untuk melihat hasil analisis mendalam kemampuan Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
        {/* FREE PLAN */}
        <Card
          className={`p-8 border-2 cursor-pointer transition-all duration-300 rounded-2xl ${
            selectedPlan === "free"
              ? "border-gsb-blue bg-blue-50/20 shadow-xl scale-[1.02]"
              : "border-gray-200 hover:border-gsb-blue/30 hover:shadow-lg"
          }`}
          onClick={() => setSelectedPlan("free")}
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
          >
            Pilih Gratis
          </Button>
        </Card>

        {/* PAID PLAN */}
        <Card
          className={`relative p-8 border-2 cursor-pointer transition-all duration-300 rounded-2xl ${
            selectedPlan === "paid"
              ? "border-gsb-orange bg-orange-50/20 shadow-xl scale-[1.02] ring-2 ring-gsb-orange/10"
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
              <span className="font-medium text-foreground">Skor Langsung Keluar</span>
            </li>
            <li className="flex gap-3 items-center text-base">
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              <span className="font-medium text-foreground">Ranking Nasional</span>
            </li>
            <li className="flex gap-3 items-center text-base bg-orange-50 p-2 -ml-2 rounded-lg border border-orange-100">
              <ShieldCheck className="w-5 h-5 text-gsb-orange shrink-0" />
              <b className="text-gsb-orange">Pembahasan Lengkap (PDF/Video)</b>
            </li>
            <li className="flex gap-3 items-center text-base">
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              <span className="font-medium text-foreground">Analisis Kelemahan</span>
            </li>
          </ul>
          <Button
            className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white h-12 text-lg font-bold rounded-xl shadow-md hover:shadow-lg"
            variant="default"
          >
            Pilih Premium
          </Button>
        </Card>
      </div>

      {selectedPlan === "paid" && (
        <div className="bg-white p-8 rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
              <div className="relative w-64 aspect-[3/4]">
                <Image
                  src="/home/qris.jpeg"
                  alt="QRIS GSB"
                  fill
                  className="object-contain"
                />
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
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
              >
                Konfirmasi via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedPlan === "free" && (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold mb-2">Terima Kasih</h3>
          <p className="text-muted-foreground mb-4">
            Hasil tryout Anda akan diproses dan dapat dilihat pada menu &quot;Riwayat Tryout&quot; dalam 7 hari kerja.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/profile'}>
            Kembali ke Dashboard
          </Button>
        </div>
      )}
    </div>
  );
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
