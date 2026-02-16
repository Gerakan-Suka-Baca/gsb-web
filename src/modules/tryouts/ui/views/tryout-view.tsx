"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState, useEffect } from "react";
import { TryoutIntro } from "../components/TryoutIntro";
import { TryoutExam } from "../components/TryoutExam";
import { TryoutResultGate } from "../components/TryoutResultGate";
import { TryoutThankYou } from "../components/TryoutThankYou";
import { Tryout } from "@/payload-types";
import type { TryoutAttempt } from "../../types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  tryoutId: string;
}

export const TryoutView = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // Disable retries to fail fast on 401
  const { data, isLoading: isMetadataLoading, isError: isMetadataError } = useQuery(
    trpc.tryouts.getMetadata.queryOptions({ tryoutId }, { retry: false })
  );

  const { data: existingAttempt, isLoading: isAttemptLoading, isError: isAttemptError } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId }, { retry: false })
  );

  const [view, setView] = useState<"loading" | "intro" | "exam" | "result" | "thankyou">("loading");
  const [holdResult, setHoldResult] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const tryout = data as unknown as Tryout;
  
  const isSessionError = isMetadataError || isAttemptError;

  useEffect(() => {
    // Wait for metadata to load first
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
      
      // If we are upgrading from free plan, ensure we can stay on the result page
      if (isUpgrading && view === "result" && plan === "free") {
         return;
      }

      if (view !== target) setView(target);
    } else if (existingAttempt?.status === "started") {
      if (view !== "exam") setView("exam");
    } else {
      // Only default to intro if we are currently loading.
      // If we are already in 'exam' (optimistic update), don't revert to 'intro' just because data is stale.
      if (view === "loading") setView("intro");
    }
  }, [existingAttempt, isAttemptLoading, view, holdResult, isUpgrading, isMetadataLoading]);

  if (isSessionError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-center px-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
        <h2 className="text-xl font-bold text-gsb-maroon">Sesi Berakhir</h2>
        <p className="text-muted-foreground">Silakan login kembali untuk melanjutkan ujian.</p>
        <Button onClick={() => window.location.href = "/sign-in"} variant="default" className="mt-2 text-white bg-gsb-orange hover:bg-gsb-orange/90">
          Login Ulang
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
        initialAttempt={existingAttempt as TryoutAttempt}
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
        username="" 
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
        plan={(plan as "free" | "paid") ?? "free"}
        onChangePlan={() => {
            setIsUpgrading(true);
            setView("result");
        }}
      />
    );
  }

  return null;
};
