"use server";

import { getPayloadCached } from "@/lib/payload";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  username: string;
  fullName: string;
  whatsapp: string;
  schoolOrigin: string;
  schoolType: "SMA" | "SMK";
  grade: "10" | "11" | "12" | "gap_year";
  targetPTN: string;
  targetMajor: string;
  targetPTN2: string;
  targetMajor2: string;
  targetPTN3?: string;
  targetMajor3?: string;
  dateOfBirth?: Date;
}

export const updateProfile = async (data: UpdateProfileInput) => {
  const [authResult, payload] = await Promise.all([auth(), getPayloadCached()]);
  const { userId } = authResult;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Find user by clerkUserId
  const existingUsers = await payload.find({
    collection: "users",
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  });

  const dbUser = existingUsers.docs[0];

  if (!dbUser) {
    throw new Error("User not found");
  }

  try {
    if (data.username !== dbUser.username) {
        const existingUser = await payload.find({
            collection: "users",
            where: {
                username: { equals: data.username },
            },
        });
        if (existingUser.docs.length > 0) {
            return { success: false, message: "Username tidak tersedia" };
        }
    }

    const normalizeOptional = (value?: string) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const updateData: Record<string, unknown> = {
      username: data.username,
      fullName: data.fullName,
      whatsapp: data.whatsapp.replace(/\D/g, ""),
      schoolOrigin: data.schoolOrigin,
      schoolType: data.schoolType,
      grade: data.grade,
      targetPTN: data.targetPTN.trim(),
      targetMajor: data.targetMajor.trim(),
      targetPTN2: data.targetPTN2.trim(),
      targetMajor2: data.targetMajor2.trim(),
      targetPTN3: normalizeOptional(data.targetPTN3),
      targetMajor3: normalizeOptional(data.targetMajor3),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
    };

    await payload.update({
      collection: "users",
      id: dbUser.id,
      data: updateData,
    });

    revalidatePath("/profile");
    return { success: true, message: "Profil berhasil diperbarui" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Gagal memperbarui profil" };
  }
};
