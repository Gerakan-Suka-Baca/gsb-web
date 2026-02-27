"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Target } from "lucide-react";
import { ProgramMetricsDisplay } from "@/modules/universitas/ui/components/ProgramMetricsDisplay";

type ProgramMetric = {
  year?: string;
  capacity?: number | null;
  applicants?: number | null;
  predictedApplicants?: number | null;
  admissionMetric?: string | null;
  passingPercentage?: string | null;
  avgUkt?: string | null;
  maxUkt?: string | null;
};

type ProgramItem = {
  id?: string;
  name?: string;
  level?: string;
  category?: string;
  accreditation?: string;
  metrics?: ProgramMetric[];
};

interface ProgramListDropdownProps {
  faculties: string[];
  groupedPrograms: Record<string, ProgramItem[]>;
}

export function ProgramListDropdown({ faculties, groupedPrograms }: ProgramListDropdownProps) {
  const [activeFaculty, setActiveFaculty] = useState<string>(faculties[0] || "");

  if (faculties.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-xl border border-dashed border-border">
        <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-1">Daftar Prodi Kosong</h3>
        <p className="text-sm">Belum ada data Program Studi yang tercatat untuk Universitas ini.</p>
      </div>
    );
  }

  const activePrograms = groupedPrograms[activeFaculty] || [];

  return (
    <div className="w-full space-y-6">
      <div className="bg-card dark:bg-card/50 p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Pilih Fakultas</h3>
            <p className="text-xs text-muted-foreground">Menampilkan {activePrograms.length} Program Studi</p>
          </div>
        </div>
        <div className="w-full sm:w-[300px]">
          <Select value={activeFaculty} onValueChange={setActiveFaculty}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-border">
              <SelectValue placeholder="Pilih Fakultas..." />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-border">
              {faculties.map(fac => (
                <SelectItem 
                  key={fac} 
                  value={fac} 
                  className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer"
                >
                  {fac}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card dark:bg-card/50 rounded-xl shadow-sm border border-border overflow-hidden px-4 py-2 sm:px-6 sm:py-4">
        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 pt-2 border-b border-border pb-4">
          <div className="w-2 h-6 bg-primary rounded-full" />
          {activeFaculty}
        </h3>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {activePrograms.map((prog, idx) => {
            const latestMetric = prog.metrics?.[0];

            return (
              <AccordionItem key={prog.id || idx} value={`item-${idx}`} className="bg-background border text-foreground border-border rounded-xl px-2 sm:px-4 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all data-[state=open]:border-primary/50 data-[state=open]:shadow-md data-[state=open]:ring-1 data-[state=open]:ring-primary/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-4 text-left">
                    <div>
                      <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors block mb-1">
                        {prog.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground font-semibold border-none">
                          {prog.level || "S1"}
                        </Badge>
                        {prog.category && (
                          <Badge className={`font-bold border-none uppercase ${prog.category === 'snbt' ? 'bg-primary/10 text-primary' : prog.category === 'snbp' ? 'bg-gsb-tosca/10 text-gsb-tosca' : 'bg-gsb-pink/10 text-gsb-pink'}`}>
                            Jalur {prog.category}
                          </Badge>
                        )}
                        {prog.accreditation && (
                          <Badge variant="outline" className="text-[10px] text-gsb-tosca dark:text-gsb-tosca/90 border-gsb-tosca/20 bg-gsb-tosca/10 hidden sm:inline-flex uppercase font-bold tracking-wider">
                            {prog.accreditation}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {latestMetric && (
                      <div className="hidden xl:flex items-center gap-4 text-sm font-medium text-muted-foreground shrink-0">
                        {latestMetric.capacity && (
                          <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-md border border-border">
                            <Users className="w-4 h-4 text-gsb-tosca" />
                            Daya Tampung: <span className="text-gsb-tosca font-bold">{latestMetric.capacity}</span>
                          </span>
                        )}
                         {latestMetric.admissionMetric && (
                          <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-md border border-border">
                            <Target className="w-4 h-4 text-gsb-orange" />
                            Skor Aman: <span className="text-gsb-orange font-bold font-mono">{latestMetric.admissionMetric}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <ProgramMetricsDisplay metrics={prog.metrics || []} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
