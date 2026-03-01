"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export const SignInView = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
        {/* Brand panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-gsb-maroon to-gsb-red p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10">
                <Link href="/" className="flex items-center gap-2 mb-8">
                     <span className="text-2xl font-bold tracking-tighter">Gema Simpul Berdaya</span>
                </Link>
                <div className="space-y-4 max-w-lg mt-20">
                     <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
                         Siapkan Diri Menuju PTN Impian
                     </h1>
                     <p className="text-lg text-white/80">
                         Bergabunglah dengan ribuan siswa lainnya dan raih masa depan gemilang bersama platform tryout terdepan.
                     </p>
                </div>
            </div>
            <div className="relative z-10 text-sm text-white/50">
                &copy; {new Date().getFullYear()} Gema Simpul Berdaya. Hak Cipta Dilindungi.
            </div>
        </div>

        {/* Sign-in form */}
        <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-background relative">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali</span>
            </button>

            <div className="w-full max-w-md space-y-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-responsive-maroon font-heading">Selamat Datang Kembali</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Masuk untuk melanjutkan progres belajar Anda</p>
                </div>

                <div className="flex justify-center">
                  <SignIn
                    appearance={{
                      baseTheme: resolvedTheme === "dark" ? dark : undefined,
                      elements: {
                        rootBox: "w-full",
                        cardBox: "w-full shadow-none border-0",
                        card: "w-full shadow-none border border-border rounded-2xl bg-card",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton:
                          "border-2 border-border hover:bg-muted font-semibold transition-all",
                        socialButtonsBlockButtonText: "font-semibold",
                        formButtonPrimary:
                          "bg-gsb-orange hover:bg-gsb-orange hover:brightness-110 text-white font-bold shadow-md hover:shadow-lg transition-all rounded-lg h-11",
                        formFieldInput:
                          "h-11 border-border rounded-lg focus:ring-2 focus:ring-gsb-orange/30 focus:border-gsb-orange",
                        formFieldLabel: "text-foreground font-medium",
                        footerActionLink:
                          "text-gsb-orange font-bold hover:text-gsb-orange/80",
                        dividerLine: "bg-border",
                        dividerText: "text-muted-foreground",
                        identityPreviewEditButton: "text-gsb-orange",
                        formFieldAction: "text-gsb-orange font-semibold hover:text-gsb-orange/80",
                        footer: "hidden",
                      },
                    }}
                    fallbackRedirectUrl="/tryout"
                  />
                </div>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Belum punya akun? </span>
                    <Link href="/sign-up" className="font-bold text-responsive-orange hover:opacity-90 transition-opacity">
                        Daftar Gratis
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
};
