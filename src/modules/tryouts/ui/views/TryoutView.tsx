"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState, useEffect } from "react";
import { TryoutIntro } from "../components/TryoutIntro";
import { TryoutExam } from "../components/TryoutExam";
import { TryoutResultGate } from "../components/TryoutResultGate";
import { TryoutThankYou } from "../components/TryoutThankYou";
import { Tryout } from "@/payload-types";
import { TryoutAttempt } from "../../types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  tryoutId: string;
}

export const TryoutView = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const { data, isLoading: isMetadataLoading, isError: isMetadataError, error: metadataErr } = useQuery(
    trpc.tryouts.getMetadata.queryOptions({ tryoutId }, { retry: false })
  );
  const { data: session } = useQuery(trpc.auth.session.queryOptions());

  const { data: existingAttempt, isLoading: isAttemptLoading, isError: isAttemptError, error: attemptErr } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId }, { retry: false })
  );

  const isSessionError = isMetadataError || isAttemptError;

  const isUnauthorized = 
    metadataErr?.data?.code === "UNAUTHORIZED" || attemptErr?.data?.code === "UNAUTHORIZED";
  const isNotFound = 
    metadataErr?.data?.code === "NOT_FOUND" || attemptErr?.data?.code === "NOT_FOUND";

  useEffect(() => {
    if (metadataErr) console.error("Metadata fetch error:", metadataErr);
    if (attemptErr) console.error("Attempt fetch error:", attemptErr);
  }, [metadataErr, attemptErr]);

  const [view, setView] = useState<"loading" | "intro" | "exam" | "result" | "thankyou" | "scores">("loading");
  const [holdResult, setHoldResult] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const tryout = data as unknown as Tryout;

  useEffect(() => {
    if (isMetadataLoading) return;
    
    if (isAttemptLoading) return;

    if (holdResult) {
      if (existingAttempt?.status === "completed") {
        setHoldResult(false);
        const plan = (existingAttempt as unknown as Record<string, unknown>)?.resultPlan as string | undefined;
        const target = (plan && plan !== "none") ? "thankyou" : "result";
        if (view !== target) setView(target);
      } else if (view !== "result") {
        setView("result");
      }
      return;
    }

    if (existingAttempt?.status === "completed") {
      const plan = (existingAttempt as unknown as Record<string, unknown>)?.resultPlan as string | undefined;
      const target = (plan && plan !== "none") ? "thankyou" : "result";
      
      if (isUpgrading && view === "result" && plan === "free") {
         return;
      }

      if (view !== target) setView(target);
    } else if (existingAttempt?.status === "started") {
      if (view !== "exam") setView("exam");
    } else {
      if (view === "loading") setView("intro");
    }
  }, [existingAttempt, isAttemptLoading, view, holdResult, isUpgrading, isMetadataLoading]);

  if (isUnauthorized) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-center px-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
        <h2 className="text-xl font-bold text-gsb-maroon">Sesi Berakhir</h2>
        <p className="text-muted-foreground whitespace-pre-wrap max-w-xl text-left bg-gray-100 p-4 rounded-xl font-mono text-xs text-red-600">
          Sesi Anda telah berakhir atau profil belum lengkap. Silakan login kembali.
        </p>
        <Button onClick={() => window.location.href = "/sign-in"} variant="default" className="mt-2 text-white bg-gsb-orange hover:bg-gsb-orange/90">
          Login Ulang
        </Button>
      </div>
    );
  }

  if (isNotFound || isMetadataError || isAttemptError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-center px-4">
        <div className="p-4 bg-orange-50 text-orange-600 rounded-full">⚠️</div>
        <h2 className="text-xl font-bold text-gsb-maroon">Tryout Tidak Ditemukan</h2>
        <p className="text-muted-foreground">Maaf, Tryout yang Anda cari tidak tersedia atau terjadi kesalahan sistem.</p>
        <Button onClick={() => router.push("/tryout")} variant="outline" className="mt-2">
          Kembali ke Daftar Tryout
        </Button>
      </div>
    );
  }

  if (view === "loading" || isAttemptLoading || isMetadataLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gsb-orange" />
      </div>
    );
  }

  if (view === "intro") {
    return <TryoutIntro tryout={tryout} onStart={() => setView("exam")} />;
  }

  if (view === "exam") {
    return (
      <TryoutExam
        tryout={tryout}
        initialAttempt={existingAttempt as unknown as TryoutAttempt}
        onFinish={async () => {
          setHoldResult(true);
          setView("result");
          await queryClient.invalidateQueries({
            queryKey: [["tryoutAttempts", "getAttempt"], { input: { tryoutId }, type: "query" }],
          });
        }}
      />
    );
  }

  if (view === "result") {
    return (
      <TryoutResultGate
        tryoutId={tryoutId}
        attemptId={existingAttempt?.id ?? ""}
        username={session?.user?.username || "peserta"}
        fullName={session?.user?.fullName || session?.user?.username || "Peserta"}
        tryoutTitle={tryout?.title || ""}
        isUpgrading={isUpgrading}
        onPlanSelected={(plan) => {
          if (plan === "free" || plan === "paid") {
            setView("thankyou");
            setIsUpgrading(false);
          }
        }}
      />
    );
  }

  if (view === "thankyou") {
    const plan = (existingAttempt as unknown as Record<string, unknown>)?.resultPlan as string | undefined;
    return (
      <TryoutThankYou
        tryoutId={tryoutId}
        plan={(plan as "free" | "paid") ?? "free"}
        onChangePlan={() => {
            setIsUpgrading(true);
            setView("result");
        }}
        onViewScores={() => router.push(`/tryout/${tryoutId}/results`)}
      />
    );
  }

  return null;
};
