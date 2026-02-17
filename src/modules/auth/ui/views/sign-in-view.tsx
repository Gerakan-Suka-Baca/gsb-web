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
} from "@/components/ui/form";

import { loginSchema } from "../../schemas";

export const SignInView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        toast.success("Berhasil Masuk! Mengalihkan...");
        router.push(callbackUrl);
        router.refresh();
      },
    })
  );

  const form = useForm<z.infer<typeof loginSchema>>({
    mode: "all",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login.mutate(data);
  };

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

        {/* Form */}
        <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-background">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-responsive-maroon font-heading">Selamat Datang Kembali</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Masuk untuk melanjutkan progress belajar Anda</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="nama@email.com" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                               <FormLabel className="text-foreground">Password</FormLabel>
                               <Link href="#" className="text-xs text-responsive-orange font-semibold hover:underline">Lupa Password?</Link>
                          </div>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        disabled={login.isPending}
                        type="submit"
                        className="w-full h-11 text-base font-bold bg-gsb-orange hover:bg-gsb-orange/90 text-white shadow-md hover:shadow-lg transition-all rounded-lg"
                      >
                        {login.isPending ? "Sedang Masuk..." : "Masuk Sekarang"}
                      </Button>
                    </motion.div>
                  </form>
                </Form>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Belum punya akun? </span>
                    <Link href={`/sign-up${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-bold text-responsive-orange hover:opacity-90 transition-opacity">
                        Daftar Gratis
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
};
