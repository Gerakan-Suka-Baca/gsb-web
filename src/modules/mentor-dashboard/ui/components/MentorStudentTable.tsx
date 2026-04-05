import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCircle2, GraduationCap, Target, ShieldCheck } from "lucide-react";

interface MentorStudentTableProps {
  filteredData: any[];
  openStudentModal: (studentData: any) => void;
  getBadgeColor: (level?: string) => string;
}

export const MentorStudentTable = ({ filteredData, openStudentModal, getBadgeColor }: MentorStudentTableProps) => {
  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-700 fade-in">
       <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/30 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px] py-6 pl-8 text-xs font-black uppercase tracking-wider text-muted-foreground">Identitas & Riwayat Ujian</TableHead>
                <TableHead className="py-6 text-xs font-black uppercase tracking-wider text-muted-foreground text-center">
                   <div className="flex flex-col items-center gap-1 justify-center"><GraduationCap className="w-5 h-5 text-gsb-orange" />Skor Akhir</div>
                </TableHead>
                <TableHead className="py-6 text-xs font-black uppercase tracking-wider text-muted-foreground w-[250px]">
                   <div className="flex items-center gap-2"><Target className="w-4 h-4 text-gsb-blue" />Target Impian 1</div>
                </TableHead>
                <TableHead className="py-6 text-xs font-black uppercase tracking-wider text-muted-foreground w-[250px]">
                   <div className="flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground/60" />Target Impian 2</div>
                </TableHead>
                <TableHead className="py-6 pr-8 text-xs font-black uppercase tracking-wider text-muted-foreground w-[280px]">
                   <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gsb-tosca" />Alternatif Otomatis (Top 3)</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData && filteredData.length > 0 ? (
                filteredData.map((row: any, i: number) => (
                  <TableRow key={i} className="hover:bg-accent/30 transition-colors group border-b border-border">
                    <TableCell className="p-6 align-top pl-8">
                       <button 
                          onClick={() => openStudentModal(row)}
                          className="text-left w-full hover:bg-background p-3 -ml-3 rounded-2xl transition-all group-hover:border-border border border-transparent flex gap-4 items-start"
                       >
                          <div className="w-12 h-12 rounded-full bg-gsb-orange/10 flex items-center justify-center shrink-0 border border-gsb-orange/20 mt-1 group-hover:scale-105 transition-transform">
                             <UserCircle2 className="w-7 h-7 text-gsb-orange" />
                          </div>
                          <div>
                             <p className="font-black text-responsive-maroon text-base font-heading">{row.user.fullName}</p>
                             <p className="text-xs text-muted-foreground mt-1 mb-2 truncate max-w-[150px]">{row.user.email}</p>
                             <Badge variant="outline" className="bg-background text-foreground/80 font-bold border-border">
                                {row.tryout.title}
                             </Badge>
                          </div>
                       </button>
                    </TableCell>
                    
                    <TableCell className="p-6 align-top text-center border-x border-border/50">
                       <div className="flex flex-col items-center justify-center h-full pt-2">
                          <div className={`p-4 rounded-2xl border-2 mb-2 bg-card flex flex-col items-center justify-center w-24 h-24 shadow-sm ${row.scoreDetails.finalScore > 700 ? 'border-green-400' : row.scoreDetails.finalScore > 500 ? 'border-amber-400' : 'border-red-400'}`}>
                             <span className={`text-3xl font-black font-heading ${row.scoreDetails.finalScore > 700 ? 'text-green-600' : row.scoreDetails.finalScore > 500 ? 'text-amber-600' : 'text-red-600'}`}>
                                {Math.round(row.scoreDetails.finalScore || 0)}
                             </span>
                          </div>
                          <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">UTBK 2026</span>
                       </div>
                    </TableCell>

                    <TableCell className="p-6 align-top">
                       <div className="pt-2">
                          {row.analysis?.choice1?.targetPTN ? (
                             <>
                                <p className="font-bold text-foreground text-sm leading-tight mb-1">{row.analysis.choice1.targetMajor || row.analysis.choice1.dbMajorName}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-6"><GraduationCap className="w-3 h-3"/> {row.analysis.choice1.targetPTN || row.analysis.choice1.dbUnivName}</p>
                                
                                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden group-hover:border-border transition-colors">
                                   <div className="flex justify-between items-center mb-3">
                                      <Badge className={`${getBadgeColor(row.analysis.choice1.level)} font-bold px-3`}>{row.analysis.choice1.level}</Badge>
                                      <span className={`font-black text-lg ${row.analysis.choice1.level?.includes("Aman") ? "text-green-600" : "text-destructive"}`}>
                                         {row.analysis.choice1.chance}%
                                      </span>
                                   </div>
                                   <div className="w-full bg-accent rounded-full h-1.5 mb-3">
                                      <div className={`h-1.5 rounded-full ${row.analysis.choice1.level?.includes("Aman") ? "bg-green-500" : "bg-destructive"}`} style={{ width: `${row.analysis.choice1.chance}%` }}></div>
                                   </div>
                                   <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                      <span>Passing Grade</span>
                                      <span className="text-foreground/80">{row.analysis.choice1.passingGrade}</span>
                                   </div>
                                </div>
                             </>
                          ) : (
                             <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 text-center bg-accent/30">
                                <span className="text-xs font-bold text-muted-foreground">Target Jurusan 1<br/>Tidak Ditetapkan</span>
                             </div>
                          )}
                       </div>
                    </TableCell>

                    <TableCell className="p-6 align-top">
                       <div className="pt-2">
                          {row.analysis?.choice2?.targetPTN ? (
                             <>
                                <p className="font-bold text-foreground text-sm leading-tight mb-1">{row.analysis.choice2.targetMajor || row.analysis.choice2.dbMajorName}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-6"><GraduationCap className="w-3 h-3"/> {row.analysis.choice2.targetPTN || row.analysis.choice2.dbUnivName}</p>
                                
                                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden group-hover:border-border transition-colors">
                                   <div className="flex justify-between items-center mb-3">
                                      <Badge className={`${getBadgeColor(row.analysis.choice2.level)} font-bold px-3`}>{row.analysis.choice2.level}</Badge>
                                      <span className={`font-black text-lg ${row.analysis.choice2.level?.includes("Aman") ? "text-green-600" : "text-destructive"}`}>
                                         {row.analysis.choice2.chance}%
                                      </span>
                                   </div>
                                   <div className="w-full bg-accent rounded-full h-1.5 mb-3">
                                      <div className={`h-1.5 rounded-full ${row.analysis.choice2.level?.includes("Aman") ? "bg-green-500" : "bg-destructive"}`} style={{ width: `${row.analysis.choice2.chance}%` }}></div>
                                   </div>
                                   <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                      <span>Passing Grade</span>
                                      <span className="text-foreground/80">{row.analysis.choice2.passingGrade}</span>
                                   </div>
                                </div>
                             </>
                          ) : (
                             <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 text-center bg-accent/30">
                                <span className="text-xs font-bold text-muted-foreground">Target Jurusan 2<br/>Tidak Ditetapkan</span>
                             </div>
                          )}
                       </div>
                    </TableCell>

                    <TableCell className="p-6 pr-8 align-top border-l border-border/50">
                       <div className="pt-2 flex flex-col gap-3">
                          {row.analysis?.alternatives && row.analysis.alternatives.length > 0 ? (
                             row.analysis.alternatives.slice(0, 3).map((alt: any, idx: number) => (
                                <div key={idx} className="p-3 border border-border rounded-xl bg-card shadow-sm flex justify-between items-center group-hover:border-border transition-colors">
                                   <div className="max-w-[70%]">
                                      <p className="font-bold text-foreground text-xs truncate">{alt.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{alt.universityName}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="font-black text-green-600 text-sm leading-none">{alt.chance}%</p>
                                      <span className="text-[9px] font-black text-green-600/70 uppercase">Aman</span>
                                   </div>
                                </div>
                             ))
                          ) : (
                             <div className="h-[150px] flex flex-col items-center justify-center p-6 text-center">
                                <GraduationCap className="w-8 h-8 text-border mb-2" />
                                <span className="text-xs font-bold text-muted-foreground">Alternatif aman tidak ditemukan.<br/>Skor Akhir sangat rendah.</span>
                             </div>
                          )}
                          {row.analysis?.alternatives && row.analysis.alternatives.length > 3 && (
                             <p className="text-[10px] font-bold text-center text-muted-foreground pt-2">+ {row.analysis.alternatives.length - 3} Opsi Tersedia di CSV Export</p>
                          )}
                       </div>
                    </TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow>
                   <TableCell colSpan={5} className="h-64 text-center text-muted-foreground bg-accent/30">
                      Tidak ada data siswa yang cocok dengan filter aktif.
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
       </div>
    </div>
  );
}
