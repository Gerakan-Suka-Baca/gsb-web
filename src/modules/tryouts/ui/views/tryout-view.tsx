"use client";

import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState, useEffect } from "react";
import { TryoutIntro } from "../components/TryoutIntro";
import { TryoutExam } from "../components/TryoutExam";
import { TryoutResultGate } from "../components/TryoutResultGate";
import { TryoutThankYou } from "../components/TryoutThankYou";
import { Tryout } from "@/payload-types";
import { Loader2 } from "lucide-react";

interface Props {
  tryoutId: string;
}

export const TryoutView = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.tryouts.getOne.queryOptions({ tryoutId })
  );

  const { data: existingAttempt, isLoading: isAttemptLoading } = useQuery(
    trpc.tryoutAttempts.getAttempt.queryOptions({ tryoutId })
  );

  const [view, setView] = useState<"loading" | "intro" | "exam" | "result" | "thankyou">("loading");
  const tryout = data as unknown as Tryout;

  useEffect(() => {
    if (isAttemptLoading) return;

    if (existingAttempt?.status === "completed") {
      const plan = (existingAttempt as unknown as Record<string, unknown>)?.resultPlan as string | undefined;
      if (plan && plan !== "none") {
        setView("thankyou");
      } else {
        setView("result");
      }
    } else if (existingAttempt?.status === "started") {
      setView("exam");
    } else {
      setView("intro");
    }
  }, [existingAttempt, isAttemptLoading]);

  if (view === "loading" || isAttemptLoading) {
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
    return <TryoutExam tryout={tryout} onFinish={() => setView("result")} />;
  }

  if (view === "result") {
    return (
      <TryoutResultGate
        attemptId={existingAttempt?.id ?? ""}
        username="" // Username not available in shallow fetch, default to empty
        onPlanSelected={(plan) => {
          if (plan === "free" || plan === "paid") {
            setView("thankyou");
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
        onChangePlan={() => setView("result")}
      />
    );
  }

  return null;
};
