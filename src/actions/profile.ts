"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { caller } from "@/trpc/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  username: string;
  fullName: string;
  whatsapp: string;
  schoolOrigin: string;
  grade: "10" | "11" | "12" | "gap_year";
  targetPTN: string;
  targetMajor: string;
  targetPTN2?: string;
  targetMajor2?: string;
  dateOfBirth?: Date;
}

export const updateProfile = async (data: UpdateProfileInput) => {
  const session = await caller.auth.session();

  if (!session.user) {
    throw new Error("Unauthorized");
  }

  const payload = await getPayload({ config });

  try {
    if (data.username !== session.user.username) {
        const existingUser = await payload.find({
            collection: "users",
            where: {
                username: { equals: data.username },
            },
        });
        if (existingUser.docs.length > 0) {
            return { success: false, message: "Username sudah digunakan" };
        }
    }

    await payload.update({
      collection: "users",
      id: session.user.id,
      data: {
        username: data.username,
        fullName: data.fullName,
        whatsapp: data.whatsapp,
        schoolOrigin: data.schoolOrigin,
        grade: data.grade,
        targetPTN: data.targetPTN,
        targetMajor: data.targetMajor,
        targetPTN2: data.targetPTN2,
        targetMajor2: data.targetMajor2,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
      } as any,
    });

    revalidatePath("/profile");
    return { success: true, message: "Profil berhasil diperbarui" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Gagal memperbarui profil" };
  }
};
