"use client";

import Link from "next/link";
import { Compass, Users, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const MentorNavbar = ({ adminName }: { adminName: string }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admins/logout", { method: "POST" });
      router.push("/mentor-dashboard/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/mentor-dashboard" className="flex items-center gap-2 group">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Compass className="w-5 h-5" />
             </div>
             <span className="font-heading font-bold text-lg hidden sm:block">Gerakan Suka Baca</span>
          </Link>
          
          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-1">
             <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/mentor-dashboard">
                   <Users className="w-4 h-4" />
                   Data Siswa
                </Link>
             </Button>
             <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/mentor-dashboard/pembahasan">
                   <LayoutDashboard className="w-4 h-4" />
                   Daftar Pembahasan
                </Link>
             </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-sm text-right hidden md:block">
              <p className="font-semibold">{adminName}</p>
              <p className="text-xs text-muted-foreground">Sistem Mentor Akses</p>
           </div>
           <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4 text-destructive" />
           </Button>
        </div>
      </div>
    </nav>
  );
};
