"use client";

import { useState } from "react";
import { Calendar, ChevronLeft } from "lucide-react";
import { ChevronRight, Flag } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

interface Props {
  tryoutId: string;
}

export const TryoutView = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.tryouts.getOne.queryOptions({ tryoutId }),
  );

  const [showTests, setShowTests] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const tests = data.tests ?? [];
  const lastIndex = tests.length - 1;

  if (!showTests) {
    /* -------------------------------------------------
       RULES VIEW  (same as before)
    -------------------------------------------------- */
    return (
      <div className="px-6 lg:px-20 py-14 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-col lg:items-start gap-y-5">
          <h1 className="text-3xl lg:text-4xl font-bold">{data.title}</h1>
          <div className="flex gap-2 items-center">
            <Calendar className="w-5 h-5" />
            <p className="text-base">{formatDate(data["Date Open"])}</p>
          </div>
        </div>

        <div className="mb-10">
          {tests.length > 0 && (
            <div className="my-4">
              {tests.map((t) => (
                <ul key={t.id}>
                  <li className="text-base lg:text-lg list-disc mb-2">
                    {t.title}
                  </li>
                </ul>
              ))}
            </div>
          )}

          <h2 className="text-xl lg:text-2xl mb-2 font-semibold">
            Peraturan Tryout Online
          </h2>
          <ul className="text-base list-decimal space-y-2">
            <li>
              Tryout wajib dikerjakan secara jujur dan mandiri tanpa bantuan
              pihak lain atau sumber apa pun di luar sistem.
            </li>
            <li>
              Waktu pengerjaan setiap subtes adalah sebagai berikut:
              <ul className="list-disc ml-6 mt-1">
                <li>Penalaran Umum: 30 menit</li>
                <li>Pengetahuan Kuantitatif: 20 menit</li>
                <li>Penalaran Matematika: 43 menit</li>
                <li>Literasi dalam Bahasa Inggris: 20 menit</li>
                <li>Literasi dalam Bahasa Indonesia: 43 menit</li>
                <li>Pengetahuan Pemahaman Umum: 15 menit</li>
                <li>Kemampuan Memahami Bacaan dan Menulis: 25 menit</li>
              </ul>
            </li>
            <li>
              Setiap subtes memiliki waktu terbatas dan tidak dapat dijeda,
              serta akan berakhir otomatis ketika waktu habis.
            </li>
            <li>
              Dengan menekan tombol mulai, peserta dianggap telah membaca,
              memahami, dan menyetujui seluruh peraturan tryout.
            </li>
          </ul>
        </div>

        <Button onClick={() => setShowTests(true)}>Start Tryout</Button>
      </div>
    );
  }

  /* -------------------------------------------------
     TEST VIEW  (iframe + navigation)
  -------------------------------------------------- */
  const currentTest = tests[currentIndex];

  const handleNext = () => {
    if (currentIndex < lastIndex) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleFinish = () => {
    alert("Tryout selesai, terima kasih!");
    setShowTests(false);
    setCurrentIndex(0);
    redirect("/profile");
  };

  return (
    <div className="px-6 lg:px-20 py-14 flex flex-col gap-6">
      <div className="w-full h-[75vh]">
        <iframe
          src={currentTest.url}
          className="w-full h-full border-0"
          allowFullScreen
          title={currentTest.title}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Soal {currentIndex + 1} dari {tests.length}
        </span>

        {currentIndex < lastIndex ? (
          <div className="flex gap-2">
            <Button onClick={handlePrev}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handlePrev}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleFinish}>
              Finish <Flag className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
