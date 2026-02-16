"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, LogOut, Loader2, LayoutDashboard } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  mobile?: boolean;
  onClose?: () => void;
}

export const UserMenu = ({ mobile, onClose }: UserMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery(
    trpc.auth.session.queryOptions()
  );

  const logout = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: async () => {
        queryClient.setQueryData(trpc.auth.session.queryFilter().queryKey, undefined);
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        toast.success("Berhasil keluar");
        onClose?.();
        router.push("/");
        router.refresh();
      },
      onError: (err) => {
        toast.error("Gagal keluar: " + err.message);
      },
    })
  );

  const handleLogout = () => logout.mutate(undefined);

  if (isLoading) {
      if (mobile) return <div className="h-14 w-full bg-muted rounded-full animate-pulse" />;
      return <div className="h-10 w-24 bg-muted rounded-full animate-pulse" />;
  }

  if (!session?.user) {
    const signInUrl = `/sign-in?callbackUrl=${encodeURIComponent(pathname)}`;
    if (mobile) {
        return (
            <Button variant="outline" className="w-full border-2 border-gsb-blue text-gsb-blue font-semibold rounded-full h-14 text-lg" asChild>
                <Link href={signInUrl} onClick={onClose}>Masuk</Link>
            </Button>
        );
    }
    return (
        <Button variant="outline" className="border-2 border-gsb-blue text-gsb-blue hover:bg-gsb-blue hover:text-white font-semibold rounded-full px-6 transition-all hover:scale-105" asChild>
            <Link href={signInUrl}>Masuk</Link>
        </Button>
    );
  }

  const { user } = session;
  const initials = user.username?.slice(0, 2).toUpperCase() || "US";
  const avatarUrl = user.payment && typeof user.payment !== 'string' ? user.payment.url : "";

  if (mobile) {
      return (
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={avatarUrl || ""} />
                    <AvatarFallback className="bg-gsb-orange/10 text-gsb-orange font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-sm truncate text-foreground">{user.username}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  <Link href="/profile" onClick={onClose} className="flex items-center justify-center gap-2 p-3 rounded-lg bg-background border border-border hover:bg-muted transition-colors text-sm font-medium text-muted-foreground">
                      <User className="w-4 h-4" />
                      Profil
                  </Link>
                  <Link href="/tryout" onClick={onClose} className="flex items-center justify-center gap-2 p-3 rounded-lg bg-background border border-border hover:bg-muted transition-colors text-sm font-medium text-muted-foreground">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                  </Link>
              </div>

              <Button variant="destructive" onClick={handleLogout} disabled={logout.isPending} className="w-full h-11 rounded-lg shadow-sm font-bold">
                  {logout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LogOut className="w-4 h-4 mr-2" />}
                  Keluar
              </Button>
          </div>
      );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-gsb-orange/20 hover:ring-gsb-orange transition-all p-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || ""} alt={user.username || ""} />
            <AvatarFallback className="bg-gsb-orange/10 text-gsb-orange font-bold">
                {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profil Saya</span>
            </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/tryout">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard Tryout</span>
            </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
            {logout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
