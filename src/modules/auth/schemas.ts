import { z } from "zod";

const gradeEnum = z.enum(["10", "11", "12", "gap_year"], {
  message: "Pilih kelas / status Anda",
});

const safeString = (min: number, max: number, msg: string) =>
  z.string().min(min, msg).max(max, `Maksimal ${max} karakter`);

const whatsappSchema = z
  .string()
  .min(10, "Nomor WhatsApp tidak valid")
  .max(24, "Nomor WhatsApp tidak valid")
  .regex(/^\d+$/, "Nomor WhatsApp hanya boleh angka");

const targetRequired = z
  .string()
  .min(3, "Minimal 3 karakter")
  .max(200, "Maksimal 200 karakter");

const targetOptional = z
  .string()
  .max(200, "Maksimal 200 karakter")
  .refine((val) => val.length === 0 || val.length >= 3, "Minimal 3 karakter");

export const completeProfileSchema = z.object({
  fullName: safeString(2, 200, "Nama minimal 2 karakter"),
  whatsapp: whatsappSchema,
  dateOfBirth: z.date("Tanggal lahir wajib diisi"),
  schoolOrigin: safeString(2, 200, "Nama sekolah wajib diisi"),
  schoolType: z.enum(["SMA", "SMK"], { message: "Pilih tipe sekolah" }),
  grade: gradeEnum,
  targetPTN: targetRequired,
  targetMajor: targetRequired,
  targetPTN2: targetRequired,
  targetMajor2: targetRequired,
  targetPTN3: targetOptional.optional(),
  targetMajor3: targetOptional.optional(),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
