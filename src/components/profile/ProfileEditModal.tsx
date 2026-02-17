"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UniversitySelect } from "@/components/ui/university-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { updateProfile } from "@/actions/profile";
import type { User as PayloadUser } from "@/payload-types";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Minimal 3 karakter")
    .max(63, "Maksimal 63 karakter")
    .regex(/^[^\s]+$/, "Username tidak boleh mengandung spasi.")
    .refine((val) => val.trim().length === val.length, "Username tidak boleh diawali atau diakhiri spasi"),
  fullName: z.string().min(1, "Nama Lengkap wajib diisi"),
  whatsapp: z.string().min(10, "Nomor WhatsApp tidak valid"),
  schoolOrigin: z.string().min(1, "Asal Sekolah wajib diisi"),
  grade: z.enum(["10", "11", "12", "gap_year"]),
  targetPTN: z.string().min(3, "Minimal 3 karakter"),
  targetMajor: z.string().min(3, "Minimal 3 karakter"),
  targetPTN2: z.string().optional(),
  targetMajor2: z.string().optional(),
  dateOfBirth: z.date().optional(),
});

type ProfileUser = PayloadUser & {
  targetPTN2?: string | null;
  targetMajor2?: string | null;
  dateOfBirth?: string | Date | null;
};

interface ProfileEditModalProps {
  user: ProfileUser;
}

export function ProfileEditModal({ user }: ProfileEditModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username || "",
      fullName: user.fullName || "",
      whatsapp: user.whatsapp || "",
      schoolOrigin: user.schoolOrigin || "",
      grade: (user.grade as "10" | "11" | "12" | "gap_year") || "12",
      targetPTN: user.targetPTN || "",
      targetMajor: user.targetMajor || "",
      targetPTN2: user.targetPTN2 || "",
      targetMajor2: user.targetMajor2 || "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan profil");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gsb-orange/50 text-foreground hover:bg-gsb-orange/10 dark:text-white"
        >
          <Pencil className="h-4 w-4" />
          Edit Profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Perbarui informasi profil Anda di sini. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            
            <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Data Diri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mt-2">
                          <FormLabel>Tanggal Lahir</FormLabel>
                          {/* Date input (mobile) */}
                          <div className="block md:hidden">
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    field.onChange(new Date(e.target.value));
                                  }
                                }}
                                max={format(new Date(), "yyyy-MM-dd")}
                                className="w-full"
                              />
                            </FormControl>
                          </div>
                          {/* Calendar (desktop) */}
                          <div className="hidden md:block">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "d MMMM yyyy")
                                    ) : (
                                      <span>Pilih tanggal lahir</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="start" sideOffset={4}>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  captionLayout="dropdown-buttons"
                                  fromYear={1960}
                                  toYear={new Date().getFullYear()}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Target & Akademik</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="schoolOrigin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asal Sekolah</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Target PTN (Pilihan 1)</FormLabel>
                          <FormControl>
                            <UniversitySelect 
                              value={field.value} 
                              onValueChange={field.onChange}
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="targetPTN2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target PTN (Pilihan 2)</FormLabel>
                          <FormControl>
                            <UniversitySelect 
                                value={field.value || ""} 
                                onValueChange={field.onChange}
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
                          <FormLabel>Target Jurusan (Pilihan 2)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
