"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState } from "react";
import { TryoutIntro } from "../components/TryoutIntro";
import { TryoutExam } from "../components/TryoutExam";
import { TryoutResultGate } from "../components/TryoutResultGate";
import { Tryout } from "@/payload-types";

interface Props {
  tryoutId: string;
}

export const TryoutView = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.tryouts.getOne.queryOptions({ tryoutId }),
  );

  const [view, setView] = useState<"intro" | "exam" | "result">("intro");

  // Cast data to Tryout type if needed, or rely on inference
  const tryout = data as unknown as Tryout;

  if (view === "intro") {
    return <TryoutIntro tryout={tryout} onStart={() => setView("exam")} />;
  }

  if (view === "exam") {
    return <TryoutExam tryout={tryout} onFinish={() => setView("result")} />;
  }

  if (view === "result") {
    return <TryoutResultGate />;
  }

  return null;
};
