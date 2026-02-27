"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useDebounce } from "use-debounce";

import { cn } from "@/lib/utils";
import { searchMajors } from "@/actions/major";

interface MajorSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  universityName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MajorSelect({
  value,
  onValueChange,
  universityName,
  placeholder = "Pilih Program Studi...",
  disabled,
}: MajorSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedValue] = useDebounce(inputValue, 500);
  const [items, setItems] = React.useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  type MajorResult = { id: string; name: string };

  React.useEffect(() => {
    if (!value) return;
    setItems((prev) => (prev.some((i) => i.value === value) ? prev : [{ value, label: value }]));
  }, [value]);

  React.useEffect(() => {
    const fetchMajors = async () => {
      if (!universityName && (!debouncedValue || debouncedValue.length < 3)) return;
      if (universityName && debouncedValue.length > 0 && debouncedValue.length < 3) return;

      setLoading(true);
      try {
        const results = await searchMajors(debouncedValue, universityName);
        const options = (results as MajorResult[]).map((major) => ({
          value: major.name,
          label: major.name,
        }));
        setItems(options);
      } catch (error) {
        console.error("Failed to fetch majors", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMajors();
  }, [debouncedValue, universityName]);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled || (!universityName && universityName !== undefined)}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {value
            ? items.find((item) => item.value === value)?.label || value
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border border-input bg-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <div className="flex items-center border-b border-input px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ketik min. 3 huruf untuk mencari..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto overscroll-contain">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mencari...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {!universityName && debouncedValue.length < 3 
                  ? "Ketik minimal 3 huruf untuk mencari." : "Program Studi tidak ditemukan."}
              </div>
            )}

            {!loading && items.length > 0 && (
              <ul className="py-1" role="listbox" id={listboxId}>
                {items.map((item) => (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={value === item.value}
                    onClick={() => {
                      onValueChange(item.value);
                      setOpen(false);
                      setInputValue("");
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                      "hover:bg-muted",
                      value === item.value && "bg-muted/50 font-medium"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === item.value ? "opacity-100 text-gsb-orange" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
