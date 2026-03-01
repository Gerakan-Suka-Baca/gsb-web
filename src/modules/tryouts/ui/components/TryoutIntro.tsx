import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Tryout, Question } from "@/payload-types";
import { Calendar, Info } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface TryoutIntroProps {
  tryout: Tryout;
  onStart: () => void;
}

export const TryoutIntro = ({ tryout, onStart }: TryoutIntroProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  useEffect(() => {
    const firstSubtest = ((tryout as Tryout & { tests: Question[] }).tests || [])[0];
    if (firstSubtest?.id) {
       queryClient.prefetchQuery(
         trpc.tryouts.getSubtest.queryOptions({ subtestId: firstSubtest.id })
       );
    }
  }, [tryout, queryClient, trpc]);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 flex flex-col gap-10">
      <div className="space-y-4 border-b border-border/50 pb-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-gsb-maroon leading-tight">
          {tryout.title}
        </h1>
        <div className="flex gap-3 items-center text-muted-foreground bg-gsb-yellow/10 w-fit px-4 py-2 rounded-full border border-gsb-yellow/20">
          <Calendar className="w-5 h-5 text-gsb-orange" />
          <p className="font-medium">{formatDate(tryout.dateOpen)}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-gsb-blue/10 rounded-lg">
                <Info className="w-6 h-6 text-gsb-blue" />
             </div>
             <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                Peraturan Tryout Online
            </h2>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <ul className="space-y-4 text-base md:text-lg text-muted-foreground">
            <li className="flex gap-3">
                <span className="font-bold text-gsb-orange">1.</span>
                <span>Tryout wajib dikerjakan secara jujur dan mandiri tanpa bantuan pihak lain atau sumber apa pun di luar sistem.</span>
            </li>
            <li className="flex gap-3 flex-col md:flex-row md:items-start">
                <span className="font-bold text-gsb-orange">2.</span>
                <div className="w-full">
                    <span>Waktu pengerjaan setiap subtes adalah sebagai berikut:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                         {((tryout as Tryout & { tests: Question[] }).tests || []).map((q, idx) => (
                             <div key={idx} className="flex justify-between items-center bg-muted/30 px-3 py-2 rounded-md border border-border/50 text-sm">
                                 <span className="font-medium">{q.title || q.subtest || "Soal Tanpa Kategori"}</span>
                                 <span className="font-mono text-gsb-blue font-bold">{q.duration ? `${q.duration} Menit` : "-"}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </li>
            <li className="flex gap-3">
                <span className="font-bold text-gsb-orange">3.</span>
                <span>Setiap subtes memiliki waktu terbatas dan tidak dapat dijeda, serta akan berakhir otomatis ketika waktu habis.</span>
            </li>
            <li className="flex gap-3">
                <span className="font-bold text-gsb-orange">4.</span>
                <span>Dengan menekan tombol mulai, peserta dianggap telah membaca, memahami, dan menyetujui seluruh peraturan tryout.</span>
            </li>
            </ul>
        </div>
      </div>

      <div>
        <Button 
            size="lg" 
            onClick={onStart} 
            className="w-full md:w-auto bg-gsb-orange hover:bg-gsb-orange hover:brightness-110 text-white font-bold text-lg h-14 px-10 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
            Saya Siap Mengerjakan
        </Button>
      </div>
    </div>
  );
};
