"use client";

import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UniversitySelect } from "@/components/ui/university-select";

import { registerSchema } from "../../schemas";

export const SignUpView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onError: (error) => {
         toast.error(error.message);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        toast.success("Akun berhasil dibuat! Mengalihkan...");
        router.push(callbackUrl);
        router.refresh();
      },
    })
  );

  const form = useForm<z.infer<typeof registerSchema>>({
    mode: "all",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      fullName: "",
      whatsapp: "",
      schoolOrigin: "",
      grade: "12",
      targetPTN: "",
      targetMajor: "",
      targetPTN2: "",
      targetMajor2: "",
    },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    register.mutate(data);
  };
  const passwordValue = form.watch("password") || "";
  const passwordRules = [
    { key: "upper", label: "Harus ada 1 huruf besar", ok: /[A-Z]/.test(passwordValue) },
    { key: "lower", label: "Harus ada 1 huruf kecil", ok: /[a-z]/.test(passwordValue) },
    { key: "number", label: "Harus ada 1 angka", ok: /[0-9]/.test(passwordValue) },
    { key: "symbol", label: "Harus ada 1 simbol", ok: /[!@#$%^&*()_\-+=\[\]{};:,.<>/?]/.test(passwordValue) },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* ... BRAND SECTION ... */}
      <div className="w-full max-w-7xl grid md:grid-cols-5 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Left Side: Brand & Info (Hidden on Mobile) */}
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

        {/* Right Side: Form */}
        <div className="md:col-span-3 p-8 lg:p-12 overflow-y-auto max-h-[90vh]">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gsb-maroon font-heading">Buat Akun Baru</h1>
                <p className="text-muted-foreground text-sm mt-1">Lengkapi data diri untuk pengalaman tryout maksimal.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* SECTION 1: Akun */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 uppercase tracking-wide">Informasi Akun</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                         <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Username
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] font-bold text-muted-foreground hover:bg-muted"
                                      aria-label="Info aturan username"
                                    >
                                      ?
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" align="center" sideOffset={8} collisionPadding={12} className="max-w-[85vw] sm:max-w-xs">
                                    <div className="space-y-2 text-xs leading-relaxed">
                                      <div>
                                        Aturan: boleh huruf besar/kecil, angka, dan simbol apa pun. Tidak boleh ada spasi.
                                      </div>
                                      <div>
                                        Boleh: <span className="font-semibold">Andi_01</span>, <span className="font-semibold">budi2025</span>, <span className="font-semibold">@rani7</span>
                                      </div>
                                      <div>
                                        Tidak boleh: <span className="font-semibold">andi 01</span>, <span className="font-semibold">rani 7</span>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="siswa_juara" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="email@sekolah.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          {passwordRules.some((rule) => !rule.ok) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <ul className="list-disc pl-4 space-y-1">
                                {passwordRules.filter((rule) => !rule.ok).map((rule) => (
                                  <li key={rule.key}>{rule.label}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/**/}
                          <FormMessage>
                            {typeof form.formState.errors.password?.message === "string" &&
                            form.formState.errors.password.message.includes("minimal 8")
                              ? form.formState.errors.password.message
                              : null}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Konfirmasi Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="Ulangi password..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* SECTION 2: Data Diri */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 uppercase tracking-wide">Data Diri</h3>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Sesuai kartu pelajar..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="08..." {...field} />
                          </FormControl>
                          <FormDescription>Untuk info jadwal dan hasil tryout.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* SECTION 3: Akademik */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 uppercase tracking-wide">Data Akademik</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <FormField
                          control={form.control}
                          name="schoolOrigin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Asal Sekolah</FormLabel>
                              <FormControl>
                                <Input placeholder="SMA N 1..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="grade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kelas / Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="10">Kelas 10</SelectItem>
                                  <SelectItem value="11">Kelas 11</SelectItem>
                                  <SelectItem value="12">Kelas 12</SelectItem>
                                  <SelectItem value="gap_year">Gap Year / Alumni</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    
                    {/* Pilihan 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                         <FormField
                          control={form.control}
                          name="targetPTN"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target PTN (Pilihan 1)</FormLabel>
                              <FormControl>
                                <UniversitySelect 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                  placeholder="Cari Universitas..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="targetMajor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Jurusan (Pilihan 1)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ilmu Komputer..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                    {/* Pilihan 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                         <FormField
                          control={form.control}
                          name="targetPTN2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target PTN (Pilihan 2 - Opsional)</FormLabel>
                              <FormControl>
                                <UniversitySelect 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                  placeholder="Cari Universitas..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="targetMajor2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Jurusan (Pilihan 2 - Opsional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Sistem Informasi..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                </div>

                <div className="pt-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      disabled={register.isPending}
                      type="submit"
                      size="lg"
                      className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold h-12 rounded-xl shadow-md transition-all"
                    >
                      {register.isPending ? "Sedang Mendaftar..." : "Daftar Sekarang"}
                    </Button>
                  </motion.div>
                </div>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">Sudah punya akun? </span>
                <Link href={`/sign-in${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-bold text-gsb-maroon hover:text-gsb-orange transition-colors">
                    Masuk di sini
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};
