"use client";

import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { Tryout } from "@/payload-types";

export const Leaderboard = () => {
  const trpc = useTRPC();
  
  // 1. Fetch available tryout batches
  const { data: tryoutsData } = useSuspenseQuery(trpc.tryouts.getMany.queryOptions({}));
  const tryouts = (tryoutsData?.docs || []) as Tryout[];
  const publishedTryouts = [...tryouts].sort((a, b) => {
    const aDate = a.dateOpen ? new Date(a.dateOpen).getTime() : new Date(a.createdAt).getTime();
    const bDate = b.dateOpen ? new Date(b.dateOpen).getTime() : new Date(b.createdAt).getTime();
    return aDate - bDate;
  }); // All visible tryouts, sorted chronologically

  // 2. State for selected Tryout
  const [selectedTryoutId, setSelectedTryoutId] = useState<string | null>(
    publishedTryouts.length > 0 ? publishedTryouts[0].id : null
  );

  // 3. Fetch Leaderboard for selected Tryout
  const { data: leaderboard, isLoading } = useQuery({
    ...trpc.tryouts.getLeaderboard.queryOptions({ 
      tryoutId: selectedTryoutId ?? "" 
    }),
    enabled: !!selectedTryoutId,
    staleTime: 60 * 1000,
  });

  if (publishedTryouts.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border/50 shadow-sm">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-muted-foreground">Belum ada Tryout yang tersedia</h3>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex flex-col items-center gap-1">
            <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase">Rank 1</span>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center gap-1">
            <Medal className="w-6 h-6 text-slate-400 fill-slate-400/20" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Rank 2</span>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center gap-1">
            <Medal className="w-6 h-6 text-amber-700 fill-amber-700/20" />
            <span className="text-[10px] font-bold text-amber-700 uppercase">Rank 3</span>
          </div>
        );
      default:
        return <span className="font-bold text-muted-foreground text-lg w-6 text-center">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-l-yellow-500";
      case 2: return "bg-gradient-to-r from-slate-400/10 to-transparent border-l-4 border-l-slate-400";
      case 3: return "bg-gradient-to-r from-amber-700/10 to-transparent border-l-4 border-l-amber-700";
      default: return "border-l-4 border-l-transparent hover:bg-muted/50";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Horizontal Filter Pills */}
      <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {publishedTryouts.map((tryout) => (
          <button
            key={tryout.id}
            onClick={() => setSelectedTryoutId(tryout.id)}
            className={cn(
              "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ring-1",
              selectedTryoutId === tryout.id
                ? "bg-gsb-orange text-white ring-gsb-orange shadow-md scale-105"
                : "bg-card text-muted-foreground ring-border/50 hover:bg-muted hover:text-foreground"
            )}
          >
            {tryout.title}
          </button>
        ))}
      </div>

      {/* Leaderboard Content */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-gsb-orange mb-4" />
            <p className="text-muted-foreground animate-pulse">Memuat peringkat peserta...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTryoutId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {!leaderboard || leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Belum ada skor</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Belum ada peserta yang menyelesaikan tryout ini atau skor sedang diproses.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Table Header */}
                  <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 md:gap-4 md:px-8 border-b bg-muted/30 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider items-center">
                    <div className="text-center w-12 md:w-16">Rank</div>
                    <div>Peserta</div>
                    <div className="text-right w-16 md:w-24">Skor</div>
                  </div>

                  {/* Table Body */}
                  <div className="flex flex-col divide-y divide-border/40">
                    {leaderboard.map((user, index) => {
                      const initials = user.name
                        ? user.name.slice(0, 2).toUpperCase()
                        : "PR";
                      
                      return (
                        <div
                          key={user.userId + "-" + index}
                          className={cn(
                            "grid grid-cols-[auto_1fr_auto] gap-3 p-3 md:gap-4 md:px-8 items-center transition-colors",
                            getRankStyle(user.rank)
                          )}
                        >
                          <div className="flex justify-center items-center w-12 md:w-16">
                            {getRankBadge(user.rank)}
                          </div>
                          
                          <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <Avatar className={cn(
                              "h-8 w-8 md:h-10 md:w-10 border shadow-sm shrink-0", 
                              user.rank <= 3 ? "border-gsb-orange/30" : "border-border"
                            )}>
                              <AvatarImage src={user.avatar || ""} />
                              <AvatarFallback className={cn(
                                "font-bold text-[10px] md:text-xs",
                                user.rank === 1 ? "bg-yellow-500/10 text-yellow-600" :
                                user.rank === 2 ? "bg-slate-500/10 text-slate-600" :
                                user.rank === 3 ? "bg-amber-700/10 text-amber-800" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 justify-center">
                              <span className="font-bold text-foreground uppercase text-[11px] sm:text-sm md:text-base leading-tight break-words line-clamp-2">
                                {user.name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-extrabold text-base md:text-lg text-gsb-orange font-heading w-16 md:w-24">
                            {Number(user.finalScore).toFixed(0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
