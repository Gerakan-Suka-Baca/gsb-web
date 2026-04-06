"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export const MentorLoginView = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const errorParam = searchParams.get("error");
   
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [errorMsg, setErrorMsg] = useState("");

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setErrorMsg("");

      try {
         const res = await fetch("/api/admins/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
         });

         const data = await res.json();
         if (!res.ok) {
            setErrorMsg(data.errors?.[0]?.message || data.message || "Email atau kata sandi tidak valid.");
            setIsLoading(false);
            return;
         }

         window.location.href = "/mentor-dashboard";
      } catch {
         setErrorMsg("Terjadi kesalahan jaringan.");
         setIsLoading(false);
      }
   };

   return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
        {/* Left branding panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-gsb-maroon to-gsb-red p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10">
                <Link href="/" className="flex items-center gap-2 mb-8">
                     <span className="text-2xl font-bold tracking-tighter">Gema Simpul Berdaya</span>
                </Link>
                <div className="space-y-4 max-w-lg mt-20">
                     <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
                         Mentor Intelligence System
                     </h1>
                     <p className="text-lg text-white/80">
                         Akses eksklusif untuk admin dan mentor melakukan pemantauan nilai, evaluasi akademik peserta, dan daftar pembahasan secara real-time.
                     </p>
                </div>
            </div>
            <div className="relative z-10 text-sm text-white/50">
                &copy; {new Date().getFullYear()} Gema Simpul Berdaya. Hak Cipta Dilindungi.
            </div>
        </div>

        {/* Right login form panel */}
        <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-background relative">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali</span>
            </button>

            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4 }}
               className="w-full max-w-md space-y-8"
            >
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-responsive-maroon font-heading">Portal Intervensi Mentor</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Autentikasi menggunakan kredensial sistem Payload CMS.</p>
                </div>

                <div className="flex justify-center w-full">
                  <div className="w-full border border-border rounded-2xl bg-card p-6 md:p-8">
                     {(errorParam === "forbidden" || errorMsg) && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-6 border border-destructive/20 text-center font-medium">
                           {errorMsg || "Akses dilarang. Harap gunakan akun dengan peran otoritas."}
                        </div>
                     )}
                     
                     <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="email" className="text-foreground font-medium">Alamat Email</Label>
                           <Input 
                              id="email" 
                              type="email" 
                              placeholder="admin@domain.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="h-11 border-border rounded-lg focus:ring-2 focus:ring-gsb-orange/30 focus:border-gsb-orange"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="password" className="text-foreground font-medium">Kata Sandi</Label>
                           <Input 
                              id="password" 
                              type="password" 
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="h-11 border-border rounded-lg focus:ring-2 focus:ring-gsb-orange/30 focus:border-gsb-orange"
                           />
                        </div>
                        <Button type="submit" className="w-full mt-4 bg-gsb-orange hover:bg-gsb-orange hover:brightness-110 text-white font-bold shadow-md hover:shadow-lg transition-all rounded-lg h-11" disabled={isLoading}>
                           {isLoading ? (
                              <>
                                 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                 Memverifikasi
                              </>
                           ) : (
                              "Masuk Dashboard"
                           )}
                        </Button>
                     </form>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                    Sistem Pemantauan Performa Tryout Hak Cipta Gema Simpul Berdaya.
                </div>
            </motion.div>
        </div>
    </div>
   );
}
