"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchUniversities } from "@/actions/university";

interface UniversitySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UniversitySelect({
  value,
  onValueChange,
  placeholder = "Pilih Universitas...",
  disabled,
}: UniversitySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedValue] = useDebounce(inputValue, 500);
  const [items, setItems] = React.useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Initialize with current value if exists
  React.useEffect(() => {
    if (!value) return;
    setItems((prev) => (prev.some((i) => i.value === value) ? prev : [{ value, label: value }]));
  }, [value]);

  React.useEffect(() => {
    const fetchUniversities = async () => {
      if (!debouncedValue || debouncedValue.length < 3) return;
      
      setLoading(true);
      try {
        const results = await searchUniversities(debouncedValue);
        const options = results.map((uni) => ({
          value: uni.name,
          label: uni.name,
        }));
        
        // Merge with existing selected item if confusing
        setItems(options);
      } catch (error) {
        console.error("Failed to fetch universities", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, [debouncedValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? items.find((item) => item.value === value)?.label || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cari nama universitas (min. 3 huruf)..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Mencari...
              </div>
            )}
            {!loading && items.length === 0 && debouncedValue.length >= 3 && (
              <CommandEmpty>Universitas tidak ditemukan.</CommandEmpty>
            )}
            {!loading && items.length === 0 && debouncedValue.length < 3 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Ketik minimal 3 huruf untuk mencari.
              </div>
            )}
            
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
