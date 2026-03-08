"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
};

export default function PaymentHistoryPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery({
    ...trpc.tryouts.getMyPaymentHistory.queryOptions(),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-responsive-maroon">Riwayat Pembayaran</h1>
          <p className="text-sm text-muted-foreground">Semua transaksi paket hasil tryout Anda.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/profile">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali Profil
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Memuat riwayat pembayaran...</p>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Belum ada riwayat pembayaran.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">{item.tryoutTitle}</h2>
                  <p className="text-sm text-muted-foreground">{item.program}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(item.paymentDate ?? item.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gsb-orange">Rp {formatRupiah(item.amount)}</span>
                  <span className="text-xs px-2 py-1 rounded-full border">
                    {item.paymentMethod === "voucher" ? `Voucher${item.voucherCode ? ` (${item.voucherCode})` : ""}` : item.paymentMethod.toUpperCase()}
                  </span>
                  {item.status === "verified" ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Disetujui
                    </span>
                  ) : item.status === "pending" ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3" /> Perlu Persetujuan
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Ditolak
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
