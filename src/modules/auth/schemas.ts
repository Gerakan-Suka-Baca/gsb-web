import z from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(63, "Username must be at most 63 characters long")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Username can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number."
    )
    .refine(
      (val) => !val.includes("--"),
      "Username cannot contain double hyphens."
    )
    .transform((val) => val.toLowerCase()),
  fullName: z.string().min(1, "Nama Lengkap wajib diisi"),
  whatsapp: z.string().min(10, "Nomor WhatsApp tidak valid"),
  schoolOrigin: z.string().min(1, "Asal Sekolah wajib diisi"),
  grade: z.enum(["10", "11", "12", "gap_year"]),
  targetPTN: z.string().min(1, "Target PTN wajib diisi"),
  targetMajor: z.string().min(1, "Target Jurusan wajib diisi"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
