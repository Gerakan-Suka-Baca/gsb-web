"use client";

import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { registerSchema } from "../../schemas";

export const SignUpView = () => {
  const router = useRouter();

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
        router.push("/");
      },
    })
  );

  const form = useForm<z.infer<typeof registerSchema>>({
    mode: "all",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      fullName: "",
      whatsapp: "",
      schoolOrigin: "",
      grade: "12", 
      targetPTN: "",
      targetMajor: "",
    },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    register.mutate(data);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
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
                            <Input type="password" placeholder="••••••••" {...field} />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                          control={form.control}
                          name="targetPTN"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target PTN</FormLabel>
                              <FormControl>
                                <Input placeholder="UI, ITB, UGM..." {...field} />
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
                              <FormLabel>Target Jurusan</FormLabel>
                              <FormControl>
                                <Input placeholder="Ilmu Komputer..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                      disabled={register.isPending}
                      type="submit"
                      size="lg"
                      className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold h-12 rounded-xl shadow-md transition-all"
                    >
                      {register.isPending ? "Sedang Mendaftar..." : "Daftar Sekarang"}
                    </Button>
                </div>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">Sudah punya akun? </span>
                <Link href="/sign-in" className="font-bold text-gsb-maroon hover:text-gsb-orange transition-colors">
                    Masuk di sini
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};
