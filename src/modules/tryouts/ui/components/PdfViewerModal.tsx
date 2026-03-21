"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Maximize2 } from "lucide-react";
import { useEffect } from "react";
import { PDFViewer } from "@embedpdf/react-pdf-viewer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
  tryoutId?: string;
}

export const PdfViewerModal = ({ open, onOpenChange, pdfUrl, title, tryoutId }: Props) => {
  const handleFullScreen = () => {
    if (tryoutId) {
      window.open(`/tryout/${tryoutId}/pembahasan`, "_blank");
    }
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
          style={{ userSelect: "none", WebkitUserSelect: "none", minHeight: 0 }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          {pdfUrl && (
            <div style={{ position: "absolute", inset: 0 }}>
              <PDFViewer
                config={{
                  src: pdfUrl,
                  theme: { preference: "light" },
                  disabledCategories: ["annotation", "print", "export"],
                  permissions: {
                    enforceDocumentPermissions: false,
                    overrides: {
                      print: false,
                      copyContents: false,
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
