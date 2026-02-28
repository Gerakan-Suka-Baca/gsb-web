import { z } from "zod";

const gradeEnum = z.enum(["10", "11", "12", "gap_year"], {
  message: "Pilih kelas / status Anda",
});

const safeString = (min: number, max: number, msg: string) =>
  z.string().min(min, msg).max(max, `Maksimal ${max} karakter`);

export const completeProfileSchema = z.object({
  fullName: safeString(2, 200, "Nama minimal 2 karakter"),
  whatsapp: safeString(10, 24, "Nomor WhatsApp tidak valid"),
  dateOfBirth: z.date("Tanggal lahir wajib diisi"),
  schoolOrigin: safeString(2, 200, "Nama sekolah wajib diisi"),
  grade: gradeEnum,
  targetPTN: safeString(2, 200, "Target PTN wajib diisi"),
  targetMajor: safeString(2, 200, "Target Jurusan wajib diisi"),
  targetPTN2: z.string().max(200).optional(),
  targetMajor2: z.string().max(200).optional(),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
