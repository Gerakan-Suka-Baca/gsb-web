"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfRendererProps {
  pdfData: ArrayBuffer;
  containerWidth: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: Error) => void;
  onPageChange?: (page: number) => void;
  numPages: number;
  zoom: number;
  loadingNode: React.ReactNode;
  searchQuery?: string;
  activeMatchIndex?: number;
  onSearchResults?: (total: number) => void;
}

const TEXT_LAYER_STYLES = `
  .react-pdf__Page__textContent {
    position: absolute !important;
    inset: 0;
    overflow: hidden;
    line-height: 1;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
  }
  .react-pdf__Page__textContent span {
    color: transparent;
    position: absolute;
    white-space: pre;
    transform-origin: 0% 0%;
    pointer-events: none;
  }
  .react-pdf__Page__textContent span.pdf-search-highlight {
    background-color: rgba(255, 220, 0, 0.4);
    border-radius: 2px;
  }
  .react-pdf__Page__textContent span.pdf-search-active {
    background-color: rgba(255, 140, 0, 0.6);
    border-radius: 2px;
    outline: 2px solid rgba(255, 140, 0, 0.8);
  }
`;

export const PdfRenderer = ({
  pdfData,
  containerWidth,
  onLoadSuccess,
  onLoadError,
  onPageChange,
  numPages,
  zoom,
  loadingNode,
  searchQuery,
  activeMatchIndex = 0,
  onSearchResults,
}: PdfRendererProps) => {
  const file = useMemo(() => ({ data: pdfData }), [pdfData]);
  const pageWidth = Math.max((containerWidth - 32) * zoom, 200);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const matchRefs = useRef<HTMLSpanElement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Track which page is currently in view
  useEffect(() => {
    if (numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let visiblePage = currentPage;
        for (const entry of entries) {
          const pageNum = Number(entry.target.getAttribute("data-page"));
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            visiblePage = pageNum;
          }
        }
        if (maxRatio > 0 && visiblePage !== currentPage) {
          setCurrentPage(visiblePage);
          onPageChange?.(visiblePage);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, currentPage, onPageChange]);

  // Search highlighting
  useEffect(() => {
    // Clear previous highlights
    matchRefs.current = [];
    document.querySelectorAll(".pdf-search-highlight, .pdf-search-active").forEach((el) => {
      el.classList.remove("pdf-search-highlight", "pdf-search-active");
    });

    if (!searchQuery || searchQuery.length < 2) {
      onSearchResults?.(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches: HTMLSpanElement[] = [];

    // Find all text layer spans that contain the search term
    const textSpans = document.querySelectorAll<HTMLSpanElement>(
      ".react-pdf__Page__textContent span"
    );

    textSpans.forEach((span) => {
      const text = span.textContent?.toLowerCase() || "";
      if (text.includes(query)) {
        span.classList.add("pdf-search-highlight");
        matches.push(span);
      }
    });

    matchRefs.current = matches;
    onSearchResults?.(matches.length);
  }, [searchQuery, numPages, onSearchResults]);

  // Scroll to active match
  useEffect(() => {
    const matches = matchRefs.current;
    if (matches.length === 0 || activeMatchIndex < 0) return;

    // Remove previous active
    matches.forEach((el) => el.classList.remove("pdf-search-active"));

    const idx = activeMatchIndex % matches.length;
    const activeEl = matches[idx];
    if (activeEl) {
      activeEl.classList.add("pdf-search-active");
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeMatchIndex]);

  const setPageRef = useCallback(
    (pageNum: number, el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
      } else {
        pageRefs.current.delete(pageNum);
      }
    },
    []
  );

  return (
    <>
      <style>{TEXT_LAYER_STYLES}</style>
      <Document
        file={file}
        onLoadSuccess={({ numPages: n }) => onLoadSuccess(n)}
        onLoadError={onLoadError}
        loading={loadingNode}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={`page_${i + 1}`}
            ref={(el) => setPageRef(i + 1, el)}
            data-page={i + 1}
            className="flex justify-center mb-2 relative"
          >
            <Page
              pageNumber={i + 1}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </Document>
    </>
  );
};
