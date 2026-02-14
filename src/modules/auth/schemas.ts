import z from "zod";

export const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(3, "Password minimal 3 karakter"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(63, "Username maksimal 63 karakter")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Username hanya boleh huruf kecil, angka, dan strip. Harus diawali dan diakhiri huruf atau angka."
    )
    .refine(
      (val) => !val.includes("--"),
      "Username tidak boleh mengandung strip ganda (--)"
    )
    .transform((val) => val.toLowerCase()),
  fullName: z.string().min(1, "Nama Lengkap wajib diisi"),
  whatsapp: z.string().min(10, "Nomor WhatsApp tidak valid"),
  schoolOrigin: z.string().min(1, "Asal Sekolah wajib diisi"),
  grade: z.enum(["10", "11", "12", "gap_year"], "Pilih kelas yang valid"),
  targetPTN: z.string().min(3, "Minimal 3 karakter"),
  targetMajor: z.string().min(3, "Minimal 3 karakter"),
  targetPTN2: z.string().optional(),
  targetMajor2: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
