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
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tryout, TryoutAttempt, Media } from "@/payload-types";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "current", label: "Aktif", icon: Play },
  { key: "registered", label: "Selesai", icon: CheckCircle2 },
  { key: "others", label: "Semua Tryout", icon: BookOpen },
] as const;

type TabKey = (typeof TABS)[number]["key"];
const TAB_KEYS = new Set<TabKey>(["current", "registered", "others"]);
const resolveTab = (value: string | null): TabKey =>
  value && TAB_KEYS.has(value as TabKey) ? (value as TabKey) : "others";

type TryoutAvailability = "not-opened" | "open" | "closed";

const toDateMs = (value: string | Date | null | undefined): number | null => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const isOpenNow = (
  openDate: string | Date | null | undefined,
  closeDate: string | Date | null | undefined,
  isPermanent?: boolean | null
): boolean => {
  if (isPermanent) return true;
  const nowMs = Date.now();
  const openMs = toDateMs(openDate);
  const closeMs = toDateMs(closeDate);
  if (openMs === null) return false;
  if (nowMs < openMs) return false;
  if (closeMs === null) return true;
  return nowMs <= closeMs;
};

const getTryoutAvailability = (
  openDate: string | Date | null | undefined,
  closeDate: string | Date | null | undefined,
  isPermanent?: boolean | null
): TryoutAvailability => {
  if (isPermanent) return "open";
  const now = Date.now();
  const openMs = toDateMs(openDate);
  const closeMs = toDateMs(closeDate);
  if (openMs === null) return "closed";
  if (now < openMs) return "not-opened";
  if (closeMs !== null && now > closeMs) return "closed";
  return "open";
};

const fadeCard = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
} as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
} as const;

type StatusBadge = "available" | "in-progress" | "finished" | "locked";

const badgeStyles: Record<StatusBadge, string> = {
  available: "bg-gsb-tosca text-white border-gsb-tosca shadow-sm ring-1 ring-white/70",
  "in-progress": "bg-gsb-yellow text-black border-gsb-yellow shadow-sm ring-1 ring-white/70",
  finished: "bg-gsb-blue text-white border-gsb-blue shadow-sm ring-1 ring-white/70",
  locked: "bg-slate-200 text-slate-800 border-slate-200 shadow-sm ring-1 ring-white/70 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700",
};
const badgeLabels: Record<StatusBadge, string> = {
  available: "Tersedia",
  "in-progress": "Sedang Dikerjakan",
  finished: "Selesai",
  locked: "Belum Tersedia",
};

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TryoutList = () => {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const tryoutQueryOptions = trpc.tryouts.getMany.queryOptions({});
  const { data } = useSuspenseQuery({
    ...tryoutQueryOptions,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const { data: myAttempts, isLoading: attemptsLoading } = useQuery(
    {
      ...trpc.tryoutAttempts.getMyAttempts.queryOptions(),
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
  const session = useQuery(trpc.auth.session.queryOptions());
  
  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab(queryTab));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveTab(resolveTab(queryTab));
  }, [queryTab]);

  const allTryouts = data.docs as Tryout[];
  const attempts = (myAttempts || []) as TryoutAttempt[];

  const attemptMap = new Map<string, TryoutAttempt>();
  for (const a of attempts) {
    const tryoutId = typeof a.tryout === "object" ? a.tryout.id : a.tryout;
    if (!tryoutId) continue;
    // Keep the newest attempt per tryout (query is sorted by -createdAt)
    if (!attemptMap.has(tryoutId)) {
      attemptMap.set(tryoutId, a);
    }
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
    } else if (isOpenNow(tryout.dateOpen, tryout.dateClose, tryout.isPermanent)) {
      availableTryouts.push(tryout);
    }
  }
  const discoverableTryouts = [...allTryouts].sort((a, b) => {
    const aOpen = toDateMs(a.dateOpen);
    const bOpen = toDateMs(b.dateOpen);
    if (aOpen !== null && bOpen !== null) return bOpen - aOpen;
    if (aOpen !== null) return -1;
    if (bOpen !== null) return 1;
    return String(b.title ?? "").localeCompare(String(a.title ?? ""));
  });

  useEffect(() => {
    if (queryTab && TAB_KEYS.has(queryTab as TabKey)) {
      return;
    }
    if (!attemptsLoading && mounted) {
      if (currentTryouts.length > 0) {
        setActiveTab("current");
      } else if (registeredTryouts.length > 0) {
        setActiveTab("registered");
      } else {
        setActiveTab("others");
      }
    }
  }, [attemptsLoading, mounted, currentTryouts.length, registeredTryouts.length, queryTab]);



  const renderCard = (tryout: Tryout, badge: StatusBadge, subtitle?: string) => {
    const descriptionValue = (tryout as unknown as Record<string, unknown>).description;
    const descriptionText = typeof descriptionValue === "string" ? descriptionValue : "";

    // Extract cover image URL from the tryout's coverImage field
    const coverImageRaw = (tryout as unknown as Record<string, unknown>).coverImage;
    const coverImageUrl =
      typeof coverImageRaw === "object" && coverImageRaw !== null
        ? (coverImageRaw as Media).url ?? null
        : null;

    const actionLabel =
      badge === "in-progress"
        ? "Lanjutkan"
        : badge === "finished"
          ? "Lihat Hasil"
          : badge === "locked"
            ? "Lihat Detail"
            : "Mulai";
    const actionClass =
      badge === "in-progress"
        ? "bg-gsb-yellow text-black"
        : badge === "finished"
          ? "bg-gsb-blue text-white"
          : badge === "locked"
            ? "bg-slate-600 text-white"
          : "bg-gsb-orange text-white";

    return (
    <motion.div key={tryout.id} variants={fadeCard}>
      <Link href={badge === "finished" ? `/tryout/${tryout.id}/results` : `/tryout/${tryout.id}`} className="block group">
        <Card className="overflow-hidden border border-border/60 hover:border-gsb-orange/40 hover:shadow-2xl transition-all duration-300 rounded-2xl bg-card/70 hover:bg-card group-hover:-translate-y-0.5">
          {/* Banner — cover image from CMS, or fallback gradient */}
          <div className="relative h-36 md:h-44 overflow-hidden">
            {coverImageUrl ? (
              <Image
                src={coverImageUrl}
                alt={tryout.title}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ebfa5] via-[#3b82f6] to-[#f97316]">
                <div className="absolute inset-0 bg-[url('/home/logo-gsb.png')] bg-no-repeat bg-center bg-contain opacity-15" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
            <div className="absolute top-3 right-3 z-10">
              <span className={cn("text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-sm", badgeStyles[badge])}>
                {badgeLabels[badge]}
              </span>
            </div>
          </div>

          {/* Card body — title, description, meta */}
          <div className="p-4 md:p-5 flex flex-col gap-2.5">
            <h3 className="text-lg md:text-xl font-heading font-extrabold text-foreground group-hover:text-gsb-orange transition-colors line-clamp-2">
              {tryout.title}
            </h3>

            {descriptionText && (
              <p className="text-muted-foreground text-sm line-clamp-2">{descriptionText}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{tryout.dateOpen ? formatDate(tryout.dateOpen) : "Jadwal belum ditentukan"}</span>
              </div>
              {subtitle && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{subtitle}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-1">
              <span className={cn("text-xs font-semibold inline-flex items-center gap-1 px-3 py-1 rounded-full shadow-sm transition-all group-hover:gap-2", actionClass)}>
                {actionLabel}
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
           Cek <button type="button" onClick={() => setActiveTab('others')} className="text-responsive-orange underline font-semibold hover:opacity-90">Semua Tryout</button> untuk melihat Tryout lain yang sedang dibuka.
         </p>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-8 md:py-12">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-responsive-maroon mb-2">
          Dashboard Tryout
        </h1>
        <p className="text-muted-foreground">
          <span suppressHydrationWarning>
            {mounted && session.data?.user ? `Halo, ${session.data.user.fullName || session.data.user.username || "Peserta"}! ` : ""}
          </span>
          Kelola dan pantau tryout kamu di sini.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Cek <button type="button" onClick={() => setActiveTab("others")} className="font-semibold text-responsive-orange hover:underline focus:outline-none">Semua Tryout</button> untuk melihat tryout yang tersedia.
        </p>
      </motion.div>



      <div className="mb-6 md:mb-8">
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
                  allTryouts.length;
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
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!mounted ? (
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {activeTab === "current" && (
              attemptsLoading
                ? renderEmpty("Memuat status tryout aktif...")
                : currentTryouts.length > 0
                ? currentTryouts.map(({ tryout, attempt }) =>
                    renderCard(tryout, "in-progress", `Dimulai ${attempt.startedAt ? formatDate(attempt.startedAt) : ""}`)
                  )
                : renderEmpty("Tidak ada tryout yang sedang dikerjakan.")
            )}

            {activeTab === "registered" && (
              attemptsLoading
                ? renderEmpty("Memuat status tryout selesai...")
                : registeredTryouts.length > 0
                ? registeredTryouts.map(({ tryout, attempt }) =>
                    renderCard(tryout, "finished", `Selesai ${attempt.completedAt ? formatDate(attempt.completedAt) : ""}`)
                  )
                : renderEmpty("Belum ada tryout yang sudah diselesaikan.")
            )}

            {activeTab === "others" && (
              discoverableTryouts.length > 0
                ? discoverableTryouts.map((tryout) => {
                    const attempt = attemptMap.get(tryout.id);
                    const badge: StatusBadge = attempt?.status === "started"
                      ? "in-progress"
                      : attempt?.status === "completed"
                        ? "finished"
                        : getTryoutAvailability(tryout.dateOpen, tryout.dateClose, tryout.isPermanent) === "open"
                          ? "available"
                          : "locked";
                    return renderCard(tryout, badge);
                  })
                : renderEmpty("Tidak ada tryout tersedia saat ini.")
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
