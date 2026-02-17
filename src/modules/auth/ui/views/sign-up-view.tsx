"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export const SignUpView = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl grid md:grid-cols-5 bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
        {/* Brand panel */}
        <div className="hidden md:flex md:col-span-2 bg-gradient-to-br from-gsb-maroon to-gsb-red text-white p-8 flex-col justify-between relative">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
             <div className="relative z-10">
                <Link href="/" className="text-2xl font-bold tracking-tighter">Gema Simpul Berdaya</Link>
                <div className="mt-12 space-y-6">
                    <h2 className="text-3xl font-heading font-bold">Mulai Perjuanganmu Hari Ini</h2>
                    <ul className="space-y-4 text-white/90">
                        <li className="flex gap-3">
                            <span className="bg-gsb-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                            <span>Akses Tryout Premium Berkualitas</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-gsb-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                            <span>Analisis Nilai IRT Real-time</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-gsb-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                            <span>Ranking Nasional & Rasionalisasi</span>
                        </li>
                    </ul>
                </div>
             </div>
             <div className="relative z-10 text-xs text-white/40 mt-12">
                Dengan mendaftar, Anda menyetujui Syarat & Ketentuan GSB.
             </div>
        </div>

        {/* Sign-up form */}
        <div className="md:col-span-3 p-8 lg:p-12 overflow-y-auto max-h-[90vh] relative">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-6"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali</span>
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-responsive-maroon font-heading">Buat Akun Baru</h1>
                <p className="text-muted-foreground text-sm mt-1">Daftar gratis untuk pengalaman tryout maksimal.</p>
            </div>

            <div className="flex justify-center">
              <SignUp
                appearance={{
                  baseTheme: resolvedTheme === "dark" ? dark : undefined,
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-none border-0",
                    card: "w-full shadow-none border border-border rounded-2xl bg-card p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border-2 border-border hover:bg-muted font-semibold transition-all",
                    socialButtonsBlockButtonText: "font-semibold",
                    formButtonPrimary:
                      "bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold shadow-md hover:shadow-lg transition-all rounded-lg h-11",
                    formFieldInput:
                      "h-11 border-border rounded-lg focus:ring-2 focus:ring-gsb-orange/30 focus:border-gsb-orange",
                    formFieldLabel: "text-foreground font-medium",
                    footerActionLink:
                      "text-gsb-orange font-bold hover:text-gsb-orange/80",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground",
                    identityPreviewEditButton: "text-gsb-orange",
                    footer: "hidden",
                  },
                }}
                forceRedirectUrl="/complete-profile"
              />
            </div>

            <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">Sudah punya akun? </span>
                <Link href="/sign-in" className="font-bold text-responsive-orange hover:opacity-90 transition-opacity">
                    Masuk di sini
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};
