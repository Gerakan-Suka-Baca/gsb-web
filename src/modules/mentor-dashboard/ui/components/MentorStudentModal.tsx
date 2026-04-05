import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, BarChart4, UserCircle2, BookOpen, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface MentorStudentModalProps {
  selectedStudent: any | null;
  onClose: () => void;
  getBadgeColor: (level?: string) => string;
}

export const MentorStudentModal = ({ selectedStudent, onClose, getBadgeColor }: MentorStudentModalProps) => {
  if (!selectedStudent) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
      <div 
         className="bg-background w-full max-w-[1400px] h-[95vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-border"
         onClick={(e) => e.stopPropagation()}
      >
         <div className="absolute top-4 right-4 z-10">
            <button 
               onClick={onClose}
               className="p-2 bg-card hover:bg-muted rounded-lg shadow-sm text-muted-foreground transition-colors border border-border"
            >
               <X className="w-5 h-5" />
            </button>
         </div>

         <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            
            <div className="w-full lg:w-[400px] bg-card border-r border-border p-8 flex flex-col shrink-0 overflow-y-auto">
               <div className="flex flex-col items-center text-center mt-4">
                  <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center border border-border mb-4">
                     <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedStudent.user.fullName}</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                     {selectedStudent.user.schoolOrigin || selectedStudent.user.schoolName || "-"}
                  </p>
               </div>

               <div className="mt-8 space-y-4">
                  <div className="bg-background p-4 rounded-xl border border-border">
                     <p className="text-xs font-semibold text-muted-foreground mb-1">Email</p>
                     <p className="font-medium text-foreground text-sm truncate">{selectedStudent.user.email}</p>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-border">
                     <p className="text-xs font-semibold text-muted-foreground mb-1">WhatsApp / No. HP</p>
                     <p className="font-medium text-foreground text-sm">{selectedStudent.user.whatsapp || selectedStudent.user.phoneNumber || "-"}</p>
                  </div>
               </div>

               <div className="mt-auto pt-8">
                  <div className={`border rounded-xl p-6 text-center bg-background`}>
                     <p className="text-sm font-semibold text-muted-foreground mb-2">Skor Akhir UTBK</p>
                     <p className="text-5xl font-bold text-foreground">
                        {Math.round(selectedStudent.scoreDetails?.finalScore || 0)}
                     </p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 bg-accent/20">
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pb-6 border-b border-border">
                  <div className="flex items-center gap-4">
                     <div className="bg-card p-3 rounded-xl border border-border">
                        <BarChart4 className="w-6 h-6 text-foreground" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-muted-foreground">Laporan Individu</p>
                        <h2 className="text-2xl font-bold text-foreground mt-1">Detail Performa Siswa</h2>
                     </div>
                  </div>
                  <Badge variant="outline" className="px-4 py-2 text-sm bg-card border-border">
                     Paket: <span className="font-semibold ml-1">{selectedStudent.tryout.title}</span>
                  </Badge>
               </div>

               <div className="bg-card rounded-2xl p-8 border border-border flex flex-col items-center">
                  <h3 className="font-bold text-lg mb-6 flex items-center justify-center gap-2 w-full border-b border-border pb-4">
                     <BookOpen className="w-5 h-5" /> Profil Penguasaan Subtes
                  </h3>
                  
                  <div className="w-full flex justify-center gap-4 md:gap-6 my-4 flex-wrap">
                     {[
                        { label: "PU", val: selectedStudent.scoreDetails?.score_PU },
                        { label: "PK", val: selectedStudent.scoreDetails?.score_PK },
                        { label: "PM", val: selectedStudent.scoreDetails?.score_PM },
                        { label: "LBE", val: selectedStudent.scoreDetails?.score_LBE },
                        { label: "LBI", val: selectedStudent.scoreDetails?.score_LBI },
                        { label: "PPU", val: selectedStudent.scoreDetails?.score_PPU },
                        { label: "KMBM", val: selectedStudent.scoreDetails?.score_KMBM }
                     ].map(s => (
                        <div key={s.label} className="flex flex-col items-center gap-1">
                           <span className="text-[11px] font-semibold text-muted-foreground">{s.label}</span>
                           <span className="text-lg font-bold text-foreground">{Math.round(s.val || 0)}</span>
                        </div>
                     ))}
                  </div>

                  <div className="w-full h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                          { subject: 'PU', score: selectedStudent.scoreDetails?.score_PU || 0 },
                          { subject: 'PK', score: selectedStudent.scoreDetails?.score_PK || 0 },
                          { subject: 'PM', score: selectedStudent.scoreDetails?.score_PM || 0 },
                          { subject: 'LBE', score: selectedStudent.scoreDetails?.score_LBE || 0 },
                          { subject: 'LBI', score: selectedStudent.scoreDetails?.score_LBI || 0 },
                          { subject: 'PPU', score: selectedStudent.scoreDetails?.score_PPU || 0 },
                          { subject: 'KMBM', score: selectedStudent.scoreDetails?.score_KMBM || 0 },
                       ]}>
                         <PolarGrid stroke="#e2e8f0" />
                         <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600 }} />
                         <PolarRadiusAxis angle={30} domain={[0, 1000]} tick={false} />
                         <Radar name="Skor" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} strokeWidth={2} />
                         <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                       </RadarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-card rounded-2xl p-8 border border-border flex flex-col">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 w-full border-b border-border pb-4">
                     <TrendingUp className="w-5 h-5" /> Riwayat Kemajuan Skor
                  </h3>
                  <div className="w-full h-[300px]">
                     {selectedStudent.history && selectedStudent.history.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedStudent.history.map((h: any, i: number) => ({
                             name: `TO ${i+1}`,
                             score: Math.round(h.scoreDetails.finalScore),
                             fullTitle: h.tryout.title
                          }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                             <YAxis domain={[0, 1000]} tick={{ fontSize: 12 }} />
                             <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullTitle || label}
                             />
                             <Line type="monotone" dataKey="score" name="Skor Akhir" stroke="#f97316" strokeWidth={2} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed rounded-xl">
                           <p className="text-sm font-medium">Siswa belum memiliki riwayat pada tryout lain.</p>
                        </div>
                     )}
                  </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl p-8 border border-border flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                           <span className="text-xs font-semibold text-muted-foreground uppercase">Pilihan 1</span>
                        </div>
                        <div>
                           <h3 className="font-bold text-2xl text-foreground">{selectedStudent.analysis?.choice1?.targetMajor || selectedStudent.analysis?.choice1?.dbMajorName || "-"}</h3>
                           <p className="text-muted-foreground text-sm font-medium">{selectedStudent.analysis?.choice1?.targetPTN || selectedStudent.analysis?.choice1?.dbUnivName || "-"}</p>
                        </div>
                        
                        <div className="bg-background p-4 rounded-xl border border-border mt-4">
                           <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-semibold text-muted-foreground">Peluang Lolos</p>
                              <Badge variant="outline" className={`${getBadgeColor(selectedStudent.analysis?.choice1?.level)}`}>
                                 {selectedStudent.analysis?.choice1?.level || "-"}
                              </Badge>
                           </div>
                           <p className="font-bold text-3xl text-foreground">{selectedStudent.analysis?.choice1?.chance || 0}%</p>
                        </div>

                        <div className="flex justify-between items-center text-sm font-medium pt-2">
                           <span className="text-muted-foreground">Nilai Aman UTBK</span>
                           <span className="font-bold text-foreground">{selectedStudent.analysis?.choice1?.passingGrade || 0}</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-card rounded-2xl p-8 border border-border flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                           <span className="text-xs font-semibold text-muted-foreground uppercase">Pilihan 2</span>
                        </div>
                        <div>
                           <h3 className="font-bold text-2xl text-foreground">{selectedStudent.analysis?.choice2?.targetMajor || selectedStudent.analysis?.choice2?.dbMajorName || "-"}</h3>
                           <p className="text-muted-foreground text-sm font-medium">{selectedStudent.analysis?.choice2?.targetPTN || selectedStudent.analysis?.choice2?.dbUnivName || "-"}</p>
                        </div>
                        
                        <div className="bg-background p-4 rounded-xl border border-border mt-4">
                           <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-semibold text-muted-foreground">Peluang Lolos</p>
                              <Badge variant="outline" className={`${getBadgeColor(selectedStudent.analysis?.choice2?.level)}`}>
                                 {selectedStudent.analysis?.choice2?.level || "-"}
                              </Badge>
                           </div>
                           <p className="font-bold text-3xl text-foreground">{selectedStudent.analysis?.choice2?.chance || 0}%</p>
                        </div>

                        <div className="flex justify-between items-center text-sm font-medium pt-2">
                           <span className="text-muted-foreground">Nilai Aman UTBK</span>
                           <span className="font-bold text-foreground">{selectedStudent.analysis?.choice2?.passingGrade || 0}</span>
                        </div>
                     </div>
                  </div>
              </div>

              <div className="bg-card rounded-2xl p-8 border border-border">
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2 w-full border-b border-border pb-4">
                     <ShieldCheck className="w-5 h-5" /> Target Universitas Alternatif
                  </h3>
                  
                  {selectedStudent.analysis?.alternatives && selectedStudent.analysis.alternatives.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedStudent.analysis.alternatives.slice(0, 5).map((alt: any, idx: number) => (
                           <div key={idx} className="bg-background border border-border p-4 rounded-xl flex flex-col justify-between">
                              <div className="mb-4">
                                 <h4 className="font-bold text-sm text-foreground mb-1">{alt.name}</h4>
                                 <p className="text-muted-foreground text-xs flex items-center gap-1"><GraduationCap className="w-3 h-3"/> {alt.universityName}</p>
                              </div>
                              <div className="flex justify-between items-center border-t border-border pt-3">
                                 <span className="text-sm font-bold text-foreground">{alt.chance}%</span>
                                 <Badge variant="secondary" className="text-[10px]">Alternatif</Badge>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-10 bg-background rounded-xl border border-dashed border-border">
                        <p className="text-sm font-medium text-foreground">Tidak ada alternatif universitas yang direkomendasikan.</p>
                     </div>
                  )}
              </div>

            </div>
         </div>
      </div>
    </div>
  );
}
