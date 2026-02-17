"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UniversitySelect } from "@/components/ui/university-select";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeProfileSchema, type CompleteProfileInput } from "@/modules/auth/schemas";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export const CompleteProfileView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user, isLoaded } = useUser();

  const form = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: "", 
      whatsapp: "",
      grade: undefined,
      schoolOrigin: "",
      targetPTN: "",
      targetMajor: "",
      targetPTN2: "",
      targetMajor2: "",
    },
  });

  // Pre-fill name from Clerk if available
  useEffect(() => {
    if (isLoaded && user) {
        if (user.fullName && !form.getValues("fullName")) {
            form.setValue("fullName", user.fullName);
        }
    }
  }, [isLoaded, user, form]);


  const completeProfileMutation = useMutation(
    trpc.auth.completeProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Profil berhasil dilengkapi!");
        void queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string[])?.[0] === "auth" });
        router.push("/");
      },
      onError: (err: { message?: string }) => {
        toast.error(err.message ?? "Gagal melengkapi profil");
      },
    })
  );

  const onSubmit = (values: CompleteProfileInput) => {
    completeProfileMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-card rounded-2xl shadow-lg border border-border p-6 md:p-10">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-responsive-maroon">
                Lengkapi Data Diri
                </h1>
                <p className="text-muted-foreground mt-1">
                Data ini membantu kami memberikan rekomendasi belajar yang tepat.
                </p>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* WhatsApp number */}
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of birth (date picker) */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          defaultMonth={field.value ?? new Date(2005, 0)}
                          fromDate={new Date(1900, 0, 1)}
                          toDate={new Date()}
                          captionLayout="dropdown"
                          classNames={{
                            caption: "flex justify-center",
                            caption_label: "hidden",
                            caption_dropdowns: "flex gap-2 justify-center",
                            dropdown: "rounded-md border border-input bg-background px-2 py-1.5 text-sm",
                            dropdown_month: "mr-1",
                            dropdown_year: "ml-1",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* School origin */}
              <FormField
                control={form.control}
                name="schoolOrigin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asal Sekolah</FormLabel>
                    <FormControl>
                      <Input placeholder="SMA Negeri..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grade / status */}
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas / Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-lg">Target Perguruan Tinggi</h3>
                <p className="text-sm text-muted-foreground">
                  Ketik minimal 3 huruf untuk mencari kampus.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="targetPTN"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Kampus (Pilihan 1)</FormLabel>
                            <FormControl>
                              <UniversitySelect
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Cari universitas (min. 3 huruf)..."
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
                            <Input placeholder="Contoh: Kedokteran, Informatika" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="targetPTN2"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Kampus (Pilihan 2) <span className="text-muted-foreground font-normal">(Opsional)</span></FormLabel>
                            <FormControl>
                              <UniversitySelect
                                value={field.value ?? ""}
                                onValueChange={field.onChange}
                                placeholder="Cari universitas (opsional)..."
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
                            <FormLabel>Target Jurusan (Pilihan 2) <span className="text-muted-foreground font-normal">(Opsional)</span></FormLabel>
                            <FormControl>
                            <Input placeholder="Contoh: Kedokteran, Informatika" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                className="bg-gsb-orange text-white hover:bg-gsb-orange/90 w-full md:w-auto min-w-[150px]"
                disabled={completeProfileMutation.isPending}
              >
                {completeProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Profil"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
