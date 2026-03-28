"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, Lock, ShieldAlert, AlertCircle, ZoomIn, ZoomOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { PdfSearchBar } from "./PdfSearchBar";

const PdfRenderer = dynamic(
  () => import("./PdfRenderer").then((mod) => mod.PdfRenderer),
  { ssr: false }
);

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 2;

interface Props {
  tryoutId: string;
}

export const ExplanationViewer = ({ tryoutId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(900);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const zoom = ZOOM_LEVELS[zoomIndex];

  const { data: explanationData, isLoading: isExplanationLoading } = useQuery(
    trpc.tryouts.getExplanation.queryOptions({ tryoutId })
  );

  const { data: scoreData } = useQuery(
    trpc.tryouts.getScoreResults.queryOptions({ tryoutId })
  );

  const viewerTitle =
    (explanationData as { title?: string })?.title ||
    scoreData?.tryoutTitle ||
    "Pembahasan Tryout";
  const pdfUrl = explanationData?.pdfUrl || "";

  const zoomIn = useCallback(() => {
    setZoomIndex((p) => Math.min(p + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomIndex((p) => Math.max(p - 1, 0));
  }, []);

  const openSearch = useCallback(() => {
    setShowSearch(true);
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
    setTotalMatches(0);
    setActiveMatchIndex(0);
  }, []);

  const handleSearchNext = useCallback(() => {
    setActiveMatchIndex((p) => (totalMatches > 0 ? (p + 1) % totalMatches : 0));
  }, [totalMatches]);

  const handleSearchPrev = useCallback(() => {
    setActiveMatchIndex((p) => (totalMatches > 0 ? (p - 1 + totalMatches) % totalMatches : 0));
  }, [totalMatches]);

  const handleSearchResults = useCallback((total: number) => {
    setTotalMatches(total);
    setActiveMatchIndex(0);
  }, []);

  const fetchPdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch(`/api/pdf-proxy?tryoutId=${tryoutId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      setPdfData(buffer);
    } catch (err) {
      setPdfError("Gagal memuat PDF. Silakan coba lagi.");
      console.error("[ExplanationViewer] fetch error:", err);
    } finally {
      setPdfLoading(false);
    }
  }, [tryoutId]);

  useEffect(() => {
    if (explanationData?.allowed && pdfUrl) {
      fetchPdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explanationData?.allowed, pdfUrl]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Block print/save shortcuts + intercept Ctrl+F for custom search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;
      if (isCtrl && key === "f") {
        event.preventDefault();
        event.stopPropagation();
        openSearch();
        return;
      }
      if (isCtrl && ["p", "s", "c", "u", "x", "a"].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [openSearch]);

  // Ctrl+Scroll zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoomIn, zoomOut]);

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
          Pembahasan hanya tersedia untuk pengguna paket Premium. Upgrade
          sekarang untuk akses penuh.
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

  if (!pdfUrl) {
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
        <div className="flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14 gap-1.5">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/tryout/${tryoutId}/results`)}
              className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary hidden sm:block" />
              <h1 className="font-bold text-foreground text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[200px]">
                {viewerTitle}
              </h1>
            </div>
          </div>

          {/* Center: Page + Zoom + Search */}
          <div className="flex items-center gap-1.5 min-w-0">
            {numPages > 0 && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/50 rounded-full px-1.5 sm:px-3 py-1">
                <span className="text-[10px] sm:text-xs font-medium text-foreground tabular-nums px-0.5 sm:px-1">
                  {currentPage}/{numPages}
                </span>
                <div className="h-3.5 w-px bg-border mx-0.5 hidden sm:block" />
                <button onClick={zoomOut} disabled={zoomIndex === 0} className="p-0.5 sm:p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Perkecil">
                  <ZoomOut className="w-3 sm:w-4 h-3 sm:h-4 text-foreground" />
                </button>
                <button onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)} className="text-[9px] sm:text-[11px] font-medium text-muted-foreground hover:text-foreground px-0.5 sm:px-1 tabular-nums" title="Reset zoom">
                  {Math.round(zoom * 100)}%
                </button>
                <button onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} className="p-0.5 sm:p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Perbesar">
                  <ZoomIn className="w-3 sm:w-4 h-3 sm:h-4 text-foreground" />
                </button>
                <div className="h-3.5 w-px bg-border mx-0.5" />
                <button onClick={showSearch ? closeSearch : openSearch} className={`p-0.5 sm:p-1 rounded hover:bg-muted transition-colors ${showSearch ? "bg-muted text-primary" : ""}`} title="Cari (Ctrl+F)">
                  <Search className="w-3 sm:w-4 h-3 sm:h-4 text-foreground" />
                </button>
              </div>
            )}

            {showSearch && (
              <PdfSearchBar
                searchQuery={searchQuery}
                onSearchChange={(q) => { setSearchQuery(q); setActiveMatchIndex(0); }}
                totalMatches={totalMatches}
                activeMatch={totalMatches > 0 ? (activeMatchIndex % totalMatches) + 1 : 0}
                onPrev={handleSearchPrev}
                onNext={handleSearchNext}
                onClose={closeSearch}
              />
            )}
          </div>

          {/* Right: Premium badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-xs text-muted-foreground bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Premium
            </span>
          </div>
        </div>
      </header>

      {/* PDF content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ userSelect: "none", WebkitUserSelect: "none", minHeight: 0 }}
        onDragStart={(e) => e.preventDefault()}
      >
        {pdfLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat PDF...</p>
            </div>
          </div>
        )}

        {pdfError && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm text-destructive">{pdfError}</p>
              <Button variant="outline" size="sm" onClick={fetchPdf}>
                Coba Lagi
              </Button>
            </div>
          </div>
        )}

        {pdfData && (
          <PdfRenderer
            pdfData={pdfData}
            containerWidth={containerWidth}
            zoom={zoom}
            onLoadSuccess={(n) => setNumPages(n)}
            onLoadError={(err) => {
              console.error("[ExplanationViewer] PDF load error:", err);
              setPdfError("Gagal memuat PDF.");
            }}
            onPageChange={setCurrentPage}
            numPages={numPages}
            searchQuery={searchQuery}
            activeMatchIndex={activeMatchIndex}
            onSearchResults={handleSearchResults}
            loadingNode={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};
