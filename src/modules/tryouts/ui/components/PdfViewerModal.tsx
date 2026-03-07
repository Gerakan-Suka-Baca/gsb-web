"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
  tryoutId?: string;
}

export const PdfViewerModal = ({ open, onOpenChange, pdfUrl, title, tryoutId }: Props) => {
  const [zoomIndex, setZoomIndex] = useState(2);
  const zoomLevels = useMemo(() => [75, 90, 100, 110, 125, 150, 175, 200], []);
  const zoomValue = zoomLevels[zoomIndex] ?? 100;
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastTouchYRef = useRef<number | null>(null);
  const handleFullScreen = () => {
    if (tryoutId) {
      window.open(`/tryout/${tryoutId}/pembahasan`, "_blank");
    }
  };
  const iframeUrl = useMemo(() => {
    const joiner = pdfUrl.includes("#") ? "&" : "#";
    return `${pdfUrl}${joiner}toolbar=0&navpanes=0&scrollbar=1&zoom=${zoomValue}`;
  }, [pdfUrl, zoomValue]);
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
    if (!open) return;
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
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setIsPdfLoading(true);
  }, [iframeUrl, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden"
        style={{ maxWidth: "1920px", width: "95vw", height: "min(90vh, 1080px)" }}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-3 border-b shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5 text-primary" />
              {title || "Pembahasan Tryout"}
            </DialogTitle>
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
              {tryoutId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullScreen}
                  className="gap-2 text-muted-foreground hover:text-foreground mr-8"
                  title="Buka di tab baru (Full Screen)"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Full Screen</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div
          className="flex-1 relative overflow-hidden"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          {isPdfLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
              <div className="w-40 h-5 bg-muted rounded animate-pulse" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            key={zoomValue}
            src={iframeUrl}
            className="w-full h-full border-0"
            title={title || "Pembahasan Tryout"}
            onLoad={() => setIsPdfLoading(false)}
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          />
          <div
            className="absolute inset-0 z-10"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            style={{ touchAction: "none", cursor: "default" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
