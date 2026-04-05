import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface MentorDashboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  tryoutFilter: string;
  setTryoutFilter: (val: string) => void;
  passingFilter: string;
  setPassingFilter: (val: string) => void;
  availableTryouts: string[];
}

export const MentorDashboardFilters = ({
  searchTerm, setSearchTerm,
  tryoutFilter, setTryoutFilter,
  passingFilter, setPassingFilter,
  availableTryouts
}: MentorDashboardFiltersProps) => {
  return (
    <Card className="border-border bg-card shadow-sm overflow-visible rounded-2xl">
       <div className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-1/3">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
                placeholder="Telusuri siswa, email, sekolah..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 bg-accent/30 border-transparent focus:border-gsb-orange/30 focus-visible:ring-gsb-orange/20 transition-all rounded-xl"
             />
          </div>
          
          <div className="flex w-full lg:w-auto items-center gap-3 flex-wrap sm:flex-nowrap">
             <div className="flex items-center gap-2 w-full sm:w-auto text-sm font-medium">
                <Filter className="w-4 h-4 text-muted-foreground" /> Tryout:
             </div>
             <Select value={tryoutFilter} onValueChange={setTryoutFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-11 bg-accent/30 border-transparent rounded-xl focus:ring-1 focus:ring-gsb-orange/50">
                   <SelectValue placeholder="Semua Paket Tryout" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                   <SelectItem value="ALL" className="font-semibold text-gsb-orange">Semua Paket Tryout</SelectItem>
                   {availableTryouts.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                   ))}
                </SelectContent>
             </Select>

             <div className="flex items-center gap-2 w-full sm:w-auto text-sm font-medium sm:ml-2">
                Status Target:
             </div>
             <Select value={passingFilter} onValueChange={setPassingFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-11 bg-accent/30 border-transparent rounded-xl focus:ring-1 focus:ring-gsb-orange/50">
                   <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                   <SelectItem value="ALL" className="font-semibold text-gsb-orange">Semua Status</SelectItem>
                   <SelectItem value="SAFE" className="text-green-600 font-medium">Lolos Aman</SelectItem>
                   <SelectItem value="COMPETITIVE" className="text-amber-600 font-medium">Kompetitif</SelectItem>
                   <SelectItem value="RISK" className="text-red-600 font-medium">Beresiko / Sulit</SelectItem>
                </SelectContent>
             </Select>
          </div>
       </div>
    </Card>
  );
}
