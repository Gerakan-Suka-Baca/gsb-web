"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Maximize2, Loader2, AlertCircle, ZoomIn, ZoomOut, Search } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { PdfSearchBar } from "./PdfSearchBar";

const PdfRenderer = dynamic(
  () => import("./PdfRenderer").then((mod) => mod.PdfRenderer),
  { ssr: false }
);

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 2;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
  tryoutId?: string;
}

// Client-side PDF cache keyed by tryoutId
const pdfCache = new Map<string, ArrayBuffer>();

export const PdfViewerModal = ({ open, onOpenChange, pdfUrl, title, tryoutId }: Props) => {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const zoom = ZOOM_LEVELS[zoomIndex];

  const handleFullScreen = () => {
    if (tryoutId) {
      window.open(`/tryout/${tryoutId}/pembahasan`, "_blank");
    }
  };

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
    if (!tryoutId) return;

    const cached = pdfCache.get(tryoutId);
    if (cached) {
      setPdfData(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pdf-proxy?tryoutId=${tryoutId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      pdfCache.set(tryoutId, buffer);
      setPdfData(buffer);
    } catch (err) {
      setError("Gagal memuat PDF. Silakan coba lagi.");
      console.error("[PdfViewerModal] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [tryoutId]);

  useEffect(() => {
    if (open && tryoutId) {
      setCurrentPage(1);
      setZoomIndex(DEFAULT_ZOOM_INDEX);
      closeSearch();
      if (!pdfCache.has(tryoutId)) {
        setPdfData(null);
        setNumPages(0);
      }
      fetchPdf();
    }
  }, [open, tryoutId, fetchPdf, closeSearch]);

  useEffect(() => {
    if (!containerRef.current || !open) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [open]);

  // Block print/save shortcuts + intercept Ctrl+F for custom search
  useEffect(() => {
    if (!open) return;
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
  }, [open, openSearch]);

  // Ctrl+Scroll zoom
  useEffect(() => {
    if (!open) return;
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
  }, [open, zoomIn, zoomOut]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden"
        style={{ maxWidth: "900px", width: "95vw", height: "min(90vh, 1080px)" }}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-3 sm:px-4 py-2 border-b shrink-0 bg-background">
          <div className="flex items-center justify-between gap-1.5">
            {/* Left: Title */}
            <DialogTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground shrink-0">
              <FileText className="w-4 h-4 text-primary hidden sm:block" />
              <span className="truncate max-w-[80px] sm:max-w-[200px]">{title || "Pembahasan Tryout"}</span>
            </DialogTitle>

            {/* Center: Page + Zoom + Search controls */}
            <div className="flex items-center gap-1.5 min-w-0">
              {numPages > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/50 rounded-full px-1.5 sm:px-2 py-1">
                  <span className="text-[10px] sm:text-[11px] font-medium text-foreground tabular-nums px-1">
                    {currentPage}/{numPages}
                  </span>
                  <div className="h-3 w-px bg-border mx-0.5 hidden sm:block" />
                  <button onClick={zoomOut} disabled={zoomIndex === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Perkecil">
                    <ZoomOut className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-foreground" />
                  </button>
                  <button onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)} className="text-[9px] sm:text-[10px] font-medium text-muted-foreground hover:text-foreground px-0.5 tabular-nums" title="Reset zoom">
                    {Math.round(zoom * 100)}%
                  </button>
                  <button onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Perbesar">
                    <ZoomIn className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-foreground" />
                  </button>
                  <div className="h-3 w-px bg-border mx-0.5" />
                  <button onClick={showSearch ? closeSearch : openSearch} className={`p-0.5 rounded hover:bg-muted transition-colors ${showSearch ? "bg-muted text-primary" : ""}`} title="Cari (Ctrl+F)">
                    <Search className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-foreground" />
                  </button>
                </div>
              )}

              {/* Search bar — inline when open */}
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

            {/* Right: Full Screen */}
            <div className="flex items-center gap-1 shrink-0">
              {tryoutId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullScreen}
                  className="gap-1 text-muted-foreground hover:text-foreground h-7 px-1.5 sm:px-2 mr-4 sm:mr-6"
                  title="Buka di tab baru (Full Screen)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Full Screen</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto"
          style={{ userSelect: "none", WebkitUserSelect: "none", minHeight: 0 }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Memuat PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
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
                console.error("[PdfViewerModal] PDF load error:", err);
                setError("Gagal memuat PDF.");
              }}
              onPageChange={setCurrentPage}
              numPages={numPages}
              searchQuery={searchQuery}
              activeMatchIndex={activeMatchIndex}
              onSearchResults={handleSearchResults}
              loadingNode={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
