"use client";

import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { useRef, useEffect, useCallback } from "react";

interface PdfSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalMatches: number;
  activeMatch: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export const PdfSearchBar = ({
  searchQuery,
  onSearchChange,
  totalMatches,
  activeMatch,
  onPrev,
  onNext,
  onClose,
}: PdfSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus when search bar appears
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          onPrev();
        } else {
          onNext();
        }
      }
    },
    [onClose, onNext, onPrev]
  );

  return (
    <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg shadow-lg px-2 py-1 min-w-0">
      <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Cari..."
        className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground w-[80px] sm:w-[120px]"
      />
      {searchQuery && (
        <>
          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap shrink-0">
            {totalMatches > 0 ? `${activeMatch}/${totalMatches}` : "0"}
          </span>
          <div className="h-3.5 w-px bg-border shrink-0" />
          <button
            onClick={onPrev}
            disabled={totalMatches === 0}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors shrink-0"
            title="Sebelumnya (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            onClick={onNext}
            disabled={totalMatches === 0}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors shrink-0"
            title="Berikutnya (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5 text-foreground" />
          </button>
        </>
      )}
      <button
        onClick={onClose}
        className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
        title="Tutup (Escape)"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
};
