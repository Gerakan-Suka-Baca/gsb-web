"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, LogOut, Trophy, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const MentorNavbar = ({ adminName }: { adminName: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/admins/logout", { method: "POST" });
      router.push("/mentor-dashboard/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const navLinks = [
    { href: "/mentor-dashboard", label: "Data Siswa", icon: Users, exact: true },
    { href: "/mentor-dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/mentor-dashboard/analytics", label: "Status Pengerjaan", icon: Activity },
    { href: "/mentor-dashboard/pembahasan", label: "Daftar Pembahasan", icon: LayoutDashboard },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/mentor-dashboard" className="flex items-center gap-2 group">
             <img src="/home/logo-gsb.png" alt="GSB Logo" className="h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-105" />
          </Link>
          
          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-1">
             {navLinks.map((link) => {
               const active = isActive(link.href, link.exact);
               return (
                 <Button
                   key={link.href}
                   variant="ghost"
                   asChild
                   className={cn(
                     "gap-2 transition-colors rounded-lg",
                     active
                       ? "bg-gsb-orange/10 text-gsb-orange font-semibold"
                       : "text-muted-foreground hover:bg-gsb-yellow/10 hover:text-gsb-orange"
                   )}
                 >
                   <Link href={link.href}>
                     <link.icon className="w-4 h-4" />
                     {link.label}
                   </Link>
                 </Button>
               );
             })}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-sm text-right hidden md:block">
              <p className="font-semibold text-responsive-maroon">{adminName}</p>
              <p className="text-xs text-muted-foreground">Sistem Mentor Akses</p>
           </div>
           <Button
             variant="outline"
             size="icon"
             onClick={handleLogout}
             className="border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
           >
              <LogOut className="w-4 h-4 text-destructive" />
           </Button>
        </div>
      </div>
    </nav>
  );
};
