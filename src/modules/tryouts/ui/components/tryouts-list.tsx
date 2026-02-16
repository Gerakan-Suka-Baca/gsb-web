"use client";


import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  FileText,
  Play,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tryout, TryoutAttempt } from "@/payload-types";

const TABS = [
  { key: "current", label: "Berjalan", icon: Play },
  { key: "registered", label: "Selesai", icon: CheckCircle2 },
  { key: "others", label: "Lainnya", icon: BookOpen },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const isOpenNow = (openDate: string | Date, closeDate: string | Date): boolean => {
  const now = new Date();
  return now >= new Date(openDate) && now <= new Date(closeDate);
};

const fadeCard = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
} as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
} as const;

type StatusBadge = "available" | "in-progress" | "finished";

const badgeStyles: Record<StatusBadge, string> = {
  available: "bg-gsb-tosca/10 text-gsb-tosca border-gsb-tosca/20",
  "in-progress": "bg-gsb-yellow/10 text-gsb-yellow border-gsb-yellow/20",
  finished: "bg-gsb-blue/10 text-gsb-blue border-gsb-blue/20",
};

const badgeLabels: Record<StatusBadge, string> = {
  available: "Tersedia",
  "in-progress": "Sedang Dikerjakan",
  finished: "Selesai",
};

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TryoutsList = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.tryouts.getMany.queryOptions({}));
  const { data: myAttempts, isLoading: attemptsLoading } = useQuery(
    trpc.tryoutAttempts.getMyAttempts.queryOptions()
  );
  const session = useQuery(trpc.auth.session.queryOptions());
  
  // Use "others" as initial state, but effect will update it
  const [activeTab, setActiveTab] = useState<TabKey>("others");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allTryouts = data.docs as Tryout[];
  const attempts = (myAttempts || []) as TryoutAttempt[];

  const attemptMap = new Map<string, TryoutAttempt>();
  for (const a of attempts) {
    const tryoutId = typeof a.tryout === "object" ? a.tryout.id : a.tryout;
    attemptMap.set(tryoutId, a);
  }

  const currentTryouts: { tryout: Tryout; attempt: TryoutAttempt }[] = [];
  const registeredTryouts: { tryout: Tryout; attempt: TryoutAttempt }[] = [];
  const availableTryouts: Tryout[] = [];

  for (const tryout of allTryouts) {
    const attempt = attemptMap.get(tryout.id);
    if (attempt?.status === "started") {
      currentTryouts.push({ tryout, attempt });
    } else if (attempt?.status === "completed") {
      registeredTryouts.push({ tryout, attempt });
    } else if (isOpenNow(tryout["Date Open"], tryout["Date Close"])) {
      availableTryouts.push(tryout);
    }
  }

  // Set default tab based on data presence
  useEffect(() => {
    if (!attemptsLoading && mounted) {
      if (currentTryouts.length > 0) {
        setActiveTab("current");
      } else if (registeredTryouts.length > 0) {
        setActiveTab("registered");
      } else {
        setActiveTab("others");
      }
    }
  }, [attemptsLoading, mounted, currentTryouts.length, registeredTryouts.length]);


  const renderCard = (tryout: Tryout, badge: StatusBadge, subtitle?: string) => {
    const descriptionValue = (tryout as unknown as Record<string, unknown>).description;
    const descriptionText = typeof descriptionValue === "string" ? descriptionValue : "";
    return (
    <motion.div key={tryout.id} variants={fadeCard}>
      <Link href={`/tryout/${tryout.id}`} className="block group">
        <Card className="p-6 border-2 border-border/50 hover:border-gsb-orange/30 hover:shadow-lg transition-all duration-300 rounded-2xl bg-card/50 hover:bg-card">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg md:text-xl font-heading font-bold text-foreground group-hover:text-gsb-orange transition-colors line-clamp-2">
                {tryout.title}
              </h3>
              <span className={cn("text-xs font-bold px-3 py-1 rounded-full border shrink-0", badgeStyles[badge])}>
                {badgeLabels[badge]}
              </span>
            </div>

            <p className="text-muted-foreground text-sm line-clamp-2">{descriptionText}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(tryout["Date Open"])}</span>
              </div>
              {subtitle && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{subtitle}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-1">
              <span className="text-sm font-medium text-gsb-orange flex items-center gap-1 group-hover:gap-2 transition-all">
                {badge === "in-progress" ? "Lanjutkan" : badge === "finished" ? "Lihat Hasil" : "Mulai"}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
    );
  };

  const renderEmpty = (message: string) => (
    <motion.div {...fadeCard} className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-2xl">📝</div>
      <p className="text-muted-foreground text-lg">{message}</p>
      {activeTab === 'current' && (
         <p className="text-muted-foreground text-sm mt-2">
           Cek <button onClick={() => setActiveTab('others')} className="text-gsb-orange underline font-semibold">Lainnya</button> untuk melihat Tryout lain yang sedang dibuka.
         </p>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-2">
          Dashboard Tryout
        </h1>
        <p className="text-muted-foreground">
          <span suppressHydrationWarning>
            {mounted && session.data?.user ? `Halo, ${session.data.user.fullName || session.data.user.username || "Peserta"}! ` : ""}
          </span>
          Kelola dan pantau tryout kamu di sini.
        </p>
      </motion.div>


      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="w-full sm:w-64">
                <Select
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as TabKey)}
                >
                    <SelectTrigger className="w-full h-12 text-base font-medium">
                        <SelectValue placeholder="Pilih status tryout" />
                    </SelectTrigger>
                    <SelectContent>
                        {TABS.map((tab) => {
                             const Icon = tab.icon;
                             const count =
                               tab.key === "current" ? currentTryouts.length :
                               tab.key === "registered" ? registeredTryouts.length :
                               availableTryouts.length;
                             
                             return (
                                <SelectItem key={tab.key} value={tab.key}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                        <span>{tab.label}</span>
                                        {count > 0 && (
                                            <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                             )
                        })}
                    </SelectContent>
                </Select>
            </div>
            
            <p className="text-sm text-muted-foreground hidden md:block">
                Cek <span className="font-semibold text-foreground">Lainnya</span> untuk melihat tryout yang tersedia.
            </p>
        </div>
      </div>

      {attemptsLoading || !mounted ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gsb-orange" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={stagger}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {activeTab === "current" && (
              currentTryouts.length > 0
                ? currentTryouts.map(({ tryout, attempt }) =>
                    renderCard(tryout, "in-progress", `Dimulai ${attempt.startedAt ? formatDate(attempt.startedAt) : ""}`)
                  )
                : renderEmpty("Tidak ada tryout yang sedang dikerjakan.")
            )}

            {activeTab === "registered" && (
              registeredTryouts.length > 0
                ? registeredTryouts.map(({ tryout, attempt }) =>
                    renderCard(tryout, "finished", `Selesai ${attempt.completedAt ? formatDate(attempt.completedAt) : ""}`)
                  )
                : renderEmpty("Belum ada tryout yang sudah diselesaikan.")
            )}

            {activeTab === "others" && (
              availableTryouts.length > 0
                ? availableTryouts.map((tryout) => renderCard(tryout, "available"))
                : renderEmpty("Tidak ada tryout baru tersedia saat ini.")
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
