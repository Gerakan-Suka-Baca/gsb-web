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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-accent rounded-lg border border-border">
             <BookOpen className="w-6 h-6 text-foreground" />
           </div>
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Pembahasan</h1>
             <p className="text-sm text-muted-foreground mt-1">Akses arsip materi evaluasi sesi tryout.</p>
           </div>
        </div>
      </div>

      <div className="relative w-full max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input 
            placeholder="Cari tryout..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 bg-card border-border shadow-sm rounded-lg"
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredTryouts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
               Tryout tidak ditemukan.
            </div>
         ) : (
            filteredTryouts.map((tryout) => (
               <Card key={tryout.id} className="border border-border bg-card flex flex-col rounded-xl overflow-hidden shadow-sm">
                  <CardHeader className="p-5 pb-3">
                     <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-bold leading-tight">
                           {tryout.title}
                        </CardTitle>
                        {tryout.isPermanent && (
                           <Badge variant="secondary" className="shrink-0">
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
                           <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-accent/50 p-3 rounded-lg border border-border">
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
                           variant="outline"
                           className="w-full gap-2 rounded-lg"
                        >
                           <FileText className="w-4 h-4" /> Lihat Pembahasan
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
