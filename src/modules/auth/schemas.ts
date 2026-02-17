import z from "zod";

const usernameRegex = /^[^\s]+$/;
const passwordSymbolRegex = /[!@#$%^&*()_\-+=\[\]{};:,.<>/?]/;
const passwordDisallowedRegex = /^[^\s"'\\`]+$/;

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  // Detailed rules shown in UI; keep schema message generic.
  .regex(/[A-Z]/, "Password belum memenuhi aturan keamanan")
  .regex(/[a-z]/, "Password belum memenuhi aturan keamanan")
  .regex(/[0-9]/, "Password belum memenuhi aturan keamanan")
  .regex(passwordSymbolRegex, "Password belum memenuhi aturan keamanan")
  .regex(passwordDisallowedRegex, "Password tidak boleh mengandung spasi atau karakter ' \" \\ `");

export const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: passwordSchema,
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(63, "Username maksimal 63 karakter")
    .regex(
      usernameRegex,
      "Username tidak boleh mengandung spasi."
    )
    .refine((val) => val.trim().length === val.length, "Username tidak boleh diawali atau diakhiri spasi"),
  fullName: z.string().min(1, "Nama Lengkap wajib diisi"),
  whatsapp: z.string().min(10, "Nomor WhatsApp tidak valid"),
  schoolOrigin: z.string().min(1, "Asal Sekolah wajib diisi"),
  grade: z.enum(["10", "11", "12", "gap_year"], "Pilih kelas yang valid"),
  targetPTN: z.string().min(3, "Minimal 3 karakter"),
  targetMajor: z.string().min(3, "Minimal 3 karakter"),
  targetPTN2: z.string().optional(),
  targetMajor2: z.string().optional(),
  confirmPassword: z.string().min(1, "Konfirmasi Password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: passwordSchema,
});
