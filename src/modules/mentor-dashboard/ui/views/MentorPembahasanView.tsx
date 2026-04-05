"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Clock, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export const MentorPembahasanView = ({ tryouts }: { tryouts: any[] }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTryouts = tryouts.filter(t => 
     t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2.5 bg-primary/10 rounded-xl">
               <BookOpen className="w-8 h-8 text-primary" />
             </div>
             <div>
               <h1 className="text-3xl font-bold font-heading tracking-tight">Eksplorasi Pembahasan</h1>
               <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  Pusat arsip dan materi evaluasi (PDF) seluruh sesi Tryout.
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input 
            placeholder="Cari nama tryout..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 bg-white border-border shadow-sm rounded-xl"
         />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredTryouts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
               Tryout tidak ditemukan.
            </div>
         ) : (
            filteredTryouts.map((tryout) => (
               <Card key={tryout.id} className="border border-border/60 hover:shadow-lg transition-all group overflow-hidden bg-white flex flex-col">
                  <div className="h-2 w-full bg-slate-100 group-hover:bg-primary transition-colors"></div>
                  <CardHeader className="p-5 pb-3">
                     <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                           {tryout.title}
                        </CardTitle>
                        {tryout.isPermanent && (
                           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 shrink-0">
                              Permanen
                           </Badge>
                        )}
                     </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                     <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {tryout.description}
                     </p>
                     
                     <div className="mt-auto space-y-4">
                        {!tryout.isPermanent && tryout.dateOpen && tryout.dateClose && (
                           <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                 <Calendar className="w-3.5 h-3.5" /> 
                                 Mulai: {new Date(tryout.dateOpen).toLocaleString("id-ID")}
                              </div>
                              <div className="flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5" />
                                 Selesai: {new Date(tryout.dateClose).toLocaleString("id-ID")}
                              </div>
                           </div>
                        )}
                        <Button 
                           onClick={() => router.push(`/mentor-dashboard/pembahasan/${tryout.id}`)}
                           className="w-full gap-2 rounded-xl bg-gsb-orange hover:bg-gsb-orange/90 text-white shadow-sm transition-all"
                        >
                           <FileText className="w-4 h-4" /> Buka Pembahasan
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            ))
         )}
      </div>
    </div>
  );
};
