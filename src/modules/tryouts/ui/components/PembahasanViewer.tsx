"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, Lock, ShieldAlert, ZoomIn, ZoomOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  tryoutId: string;
}

export const PembahasanViewer = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const [zoomIndex, setZoomIndex] = useState(2);
  const zoomLevels = useMemo(() => [75, 90, 100, 110, 125, 150, 175, 200], []);
  const zoomValue = zoomLevels[zoomIndex] ?? 100;
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastTouchYRef = useRef<number | null>(null);

  const { data: explanationData, isLoading: isExplanationLoading } = useQuery(
    trpc.tryouts.getExplanation.queryOptions({ tryoutId })
  );

  const { data: scoreData } = useQuery(
    trpc.tryouts.getScoreResults.queryOptions({ tryoutId })
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;
      if (isCtrl && ["p", "s", "c", "u", "x", "a"].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Full-screen PDF viewer
  const viewerTitle = (explanationData as { title?: string })?.title || scoreData?.tryoutTitle || "Pembahasan Tryout";
  const pdfUrl = useMemo(() => {
    const baseUrl = explanationData?.pdfUrl;
    if (!baseUrl) return "";
    const joiner = baseUrl.includes("#") ? "&" : "#";
    return `${baseUrl}${joiner}toolbar=0&navpanes=0&scrollbar=1&zoom=${zoomValue}`;
  }, [explanationData?.pdfUrl, zoomValue]);
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;
    event.preventDefault();
    iframeWindow.scrollBy(0, event.deltaY);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    lastTouchYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;
    const currentY = event.touches[0]?.clientY ?? null;
    const lastY = lastTouchYRef.current;
    if (currentY === null || lastY === null) return;
    const delta = lastY - currentY;
    lastTouchYRef.current = currentY;
    event.preventDefault();
    iframeWindow.scrollBy(0, delta);
  };
  useEffect(() => {
    setIsPdfLoading(true);
  }, [pdfUrl]);

  if (isExplanationLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!explanationData?.allowed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-screen bg-background px-4"
      >
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4 text-center">
          Akses Ditolak
        </h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
          Pembahasan hanya tersedia untuk pengguna paket Premium. Upgrade sekarang untuk akses penuh.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => router.push(`/tryout/${tryoutId}`)}
            variant="outline"
            className="gap-2 rounded-full font-semibold border-gsb-orange text-gsb-orange hover:bg-gsb-orange/10"
          >
            Upgrade ke Premium
          </Button>
          <Button
            onClick={() => router.push(`/tryout/${tryoutId}/results`)}
            variant="outline"
            className="gap-2 rounded-full font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Hasil
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!explanationData.pdfUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-screen bg-background px-4"
      >
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4 text-center">
          Pembahasan Belum Tersedia
        </h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
          File pembahasan sedang diproses. Silakan cek kembali nanti.
        </p>
        <Button
          onClick={() => router.push(`/tryout/${tryoutId}/results`)}
          variant="outline"
          className="gap-2 rounded-full font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Hasil
        </Button>
      </motion.div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-background"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/tryout/${tryoutId}/results`)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-foreground text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                {viewerTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomIndex((prev) => Math.max(0, prev - 1))}
                title="Perkecil"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-muted-foreground w-10 text-center">
                {zoomValue}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomIndex((prev) => Math.min(zoomLevels.length - 1, prev + 1))}
                title="Perbesar"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Premium
            </span>
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="absolute inset-0 z-10"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ touchAction: "none", cursor: "default" }}
        />
        {isPdfLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="w-40 h-5 bg-muted rounded animate-pulse" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={zoomValue}
          src={pdfUrl}
          className="w-full h-full border-0"
          title={viewerTitle}
          onLoad={() => setIsPdfLoading(false)}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />
      </div>
    </div>
  );
};
