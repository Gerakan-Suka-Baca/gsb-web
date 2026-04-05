import { Button } from "@/components/ui/button";
import { RefreshCw, Download, BarChart4 } from "lucide-react";
import { motion } from "framer-motion";

interface MentorDashboardHeaderProps {
  isRefetching: boolean;
  onRefetch: () => void;
  onExport: () => void;
}

export const MentorDashboardHeader = ({ isRefetching, onRefetch, onExport }: MentorDashboardHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl shadow-sm border border-gsb-orange/20 relative overflow-hidden"
    >
      {/* Soft GSB Accent Background */}
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-gsb-orange/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-4 mb-2 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="p-3 bg-gsb-orange/10 rounded-2xl border border-gsb-orange/20"
          >
            <BarChart4 className="w-8 h-8 text-gsb-orange" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black font-heading tracking-tight text-foreground">Dashboard Mentor</h1>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-1">
               <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
               Tersambung ke Basis Data
            </div>
          </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-auto relative z-10">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 md:flex-none">
          <Button 
            onClick={onRefetch} 
            variant="outline"
            disabled={isRefetching}
            className="w-full border-border hover:bg-accent hover:text-gsb-orange hover:border-gsb-orange/50 transition-colors rounded-xl h-12 px-6 font-semibold shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Sinkronisasi Data
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 md:flex-none">
          <Button onClick={onExport} className="w-full bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-xl h-12 px-6 shadow-md shadow-gsb-orange/20 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export CSV Output
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
