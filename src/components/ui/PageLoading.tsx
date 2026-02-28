"use client";

import { motion } from "framer-motion";

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div
        className="relative w-12 h-12"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-gsb-orange/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gsb-orange" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground"
      >
        Memuat...
      </motion.p>
    </div>
  );
}
