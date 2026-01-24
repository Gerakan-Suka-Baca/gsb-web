"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/* -------------------------------------------------
   Helper: is the try-out open right now?
-------------------------------------------------- */
const isOpenNow = (openDate: Date, closeDate: Date): boolean => {
  const now = new Date();
  return now >= openDate && now <= closeDate;
};

export const TryoutsList = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.tryouts.getMany.queryOptions({}));
  const session = useQuery(trpc.auth.session.queryOptions());

  /* Build Date objects once */
  const activeTryouts = data.docs.filter((t) =>
    isOpenNow(new Date(t["Date Open"]), new Date(t["Date Close"])),
  );

  if (activeTryouts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center py-10">
        No try-out available at the moment
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full justify-center items-center my-10">
      {activeTryouts.map((tryout) => (
        <div className="w-[90%]" key={tryout.id}>
          <Card className="flex flex-row justify-between hover:shadow-md transition-shadow border-none bg-card/50 hover:bg-card overflow-hidden group">
            <div className="w-full flex flex-row h-full">
              <div className="p-4 px-6 flex flex-col justify-center">
                <h4 className="text-base md:text-2xl font-heading font-bold text-foreground group-hover:text-gsb-orange transition-colors line-clamp-2 mb-2">
                  {tryout.title}
                </h4>
                <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-1">
                  {tryout.description}
                </p>

                <div className="flex gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{formatDate(tryout["Date Open"])}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>-</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{formatDate(tryout["Date Close"])}</span>
                  </div>
                </div>
              </div>
            </div>

            {session.data?.user ? (
              <Link
                className="my-auto mr-6"
                prefetch
                href={`/tryout/${tryout.id}`}
              >
                <Button variant="ghost" className="group/btn">
                  <span>Lihat detail</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Link className="my-auto mr-6" prefetch href={`/sign-in`}>
                <Button variant="ghost" className="group/btn">
                  <span>Lihat detail</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
};
