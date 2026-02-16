import { caller } from "@/trpc/server";
import { redirect } from "next/navigation";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, School, Phone, CalendarDays, Mail } from "lucide-react";
import type { User } from "@/payload-types";

export const dynamic = "force-dynamic";

type ProfileUser = User & {
  targetPTN2?: string | null;
  targetMajor2?: string | null;
  dateOfBirth?: string | null;
};

export default async function ProfilePage() {
  const session = await caller.auth.session();

  if (!session.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const user = session.user as ProfileUser;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-heading text-gsb-maroon dark:text-gsb-orange">Profil Saya</h1>
            <p className="text-muted-foreground">Halo, {user.fullName || user.username}. Kelola informasi akun dan target akademik Anda.</p>
        </div>
        <ProfileEditModal user={user} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Card */}
        <Card className="md:col-span-1 border-t-4 border-t-gsb-orange shadow-md">
            <CardHeader className="text-center">
                <div className="mx-auto w-24 h-24 bg-gsb-maroon/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🎓</span>
                </div>
                <CardTitle className="text-xl">{user.fullName}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
                <div className="flex justify-center mt-2">
                    <Badge variant="outline" className="capitalize">
                        {user.roles?.includes("super-admin") ? "Admin" : "Siswa"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{user.whatsapp || "-"}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                     <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                     </svg>
                    <span>
                        {user.dateOfBirth 
                            ? new Date(user.dateOfBirth).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : "Tanggal lahir belum diisi"}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span>Member sejak {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                    })}</span>
                </div>
            </CardContent>
        </Card>

        {/* Academic & Targets */}
        <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <School className="h-5 w-5 text-gsb-maroon" />
                        Data Akademik
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Asal Sekolah</p>
                        <p className="font-semibold">{user.schoolOrigin || "-"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Kelas / Status</p>
                        <p className="font-semibold capitalize">
                            {user.grade === "gap_year" ? "Gap Year / Alumni" : `Kelas ${user.grade || "-"}`}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-gsb-orange" />
                        Target Kampus & Jurusan
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg border">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pilihan 1</span>
                            <Badge variant="secondary" className="bg-gsb-maroon/10 text-gsb-maroon hover:bg-gsb-maroon/20">Utama</Badge>
                        </div>
                        <div className="mt-2">
                            <p className="text-lg font-bold text-gsb-maroon dark:text-gsb-orange">
                                {user.targetPTN || "Belum ditentukan"}
                            </p>
                            <p className="text-muted-foreground font-medium">
                                {user.targetMajor || "-"}
                            </p>
                        </div>
                    </div>

                    {(user.targetPTN2 || user.targetMajor2) && (
                        <div className="bg-muted/50 p-4 rounded-lg border">
                             <div className="mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pilihan 2</span>
                            </div>
                            <div className="mt-2">
                                <p className="text-lg font-bold text-foreground">
                                    {user.targetPTN2}
                                </p>
                                <p className="text-muted-foreground font-medium">
                                    {user.targetMajor2}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {!user.targetPTN && !user.targetPTN2 && (
                         <div className="text-center py-4 bg-muted/30 border border-dashed rounded-lg text-muted-foreground text-sm">
                            Anda belum menentukan target kampus. <br/> Yuk edit profil untuk menambahkan target impianmu!
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
