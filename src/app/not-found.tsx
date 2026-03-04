import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-4rem)] w-full bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-gsb-maroon to-gsb-red px-6 py-8 text-white text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Image src="/home/logo-gsb.png" alt="GSB" width={36} height={36} className="h-9 w-9 object-contain" />
          </div>
          <p className="text-sm tracking-[0.2em] font-semibold uppercase text-white/80">GSB Navigation</p>
          <h1 className="text-5xl md:text-6xl font-heading font-extrabold mt-2">404</h1>
        </div>

        <div className="px-6 md:px-10 py-8 md:py-10 text-center">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-responsive-maroon mb-3">
            Halaman tidak ditemukan
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Maaf, halaman yang kamu cari tidak tersedia atau mungkin sudah dipindahkan. Kembali ke beranda atau lanjutkan eksplorasi program GSB.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="bg-gsb-orange hover:bg-gsb-orange/90 text-white min-w-44">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-w-44">
              <Link href="/programs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Lihat Program GSB
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
