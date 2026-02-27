"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Building2,
  MapPin,
  GraduationCap,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UniversityItem {
  id: string;
  name: string;
  abbreviation: string;
  status: string;
  accreditation: string;
  city: string;
  province: string;
  programCount: number;
  imageUrl: string | null;
  completeness: number;
}

interface Props {
  universities: UniversityItem[];
  provinces: string[];
  totalPages: number;
  currentPage: number;
  totalDocs: number;
  statusFilter: string;
  provinceFilter: string;
  searchQuery: string;
}

const STATUS_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Negeri", value: "negeri" },
  { label: "Swasta", value: "swasta" },
  { label: "PTK", value: "ptk" },
];

export function UniversitasList({
  universities,
  provinces,
  totalPages,
  currentPage,
  totalDocs,
  statusFilter,
  provinceFilter,
  searchQuery,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const p = new URLSearchParams(params.toString());
      Object.entries(overrides).forEach(([k, v]) => {
        if (!v || v === "all") p.delete(k);
        else p.set(k, v);
      });
      if (overrides.page === undefined && !("page" in overrides)) {
        // Reset to page 1 when filters change
      }
      const qs = p.toString();
      return `/universitas${qs ? `?${qs}` : ""}`;
    },
    [params]
  );

  const handleSearch = (value: string) => {
    router.push(buildUrl({ q: value, page: "1" }));
  };

  const handleStatusChange = (value: string) => {
    router.push(buildUrl({ status: value, page: "1" }));
  };

  const handleProvinceChange = (value: string) => {
    router.push(buildUrl({ province: value, page: "1" }));
  };

  const clearFilters = () => {
    router.push("/universitas");
  };

  const hasActiveFilter =
    searchQuery || provinceFilter || (statusFilter && statusFilter !== "negeri");

  // Pagination range
  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gsb-maroon via-responsive-maroon to-gsb-orange opacity-95" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gsb-orange/10 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-5 border border-white/10">
              <Building2 className="w-4 h-4" />
              Database Kampus Indonesia
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-[1.1] mb-4">
              Temukan Kampus
              <span className="block text-gsb-yellow mt-1">Impianmu</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
              Jelajahi {totalDocs.toLocaleString()} universitas di Indonesia
              lengkap dengan data program studi, akreditasi, dan keketatan.
            </p>

            {/* Search */}
            <form
              className="max-w-2xl mx-auto relative group"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                handleSearch(fd.get("q") as string);
              }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-gsb-yellow via-white to-gsb-orange rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
                <Search className="w-5 h-5 text-slate-400 ml-5 shrink-0" />
                <Input
                  name="q"
                  type="text"
                  placeholder="Cari universitas, kota, atau singkatan..."
                  defaultValue={searchQuery}
                  className="border-0 h-14 sm:h-16 bg-transparent text-base sm:text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 pl-3"
                />
                <Button
                  type="submit"
                  className="mr-2 bg-gsb-orange hover:bg-gsb-orange/90 text-white rounded-lg px-5"
                >
                  Cari
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                  statusFilter === opt.value ||
                    (!statusFilter && opt.value === "negeri")
                    ? "bg-gsb-maroon text-white border-gsb-maroon shadow-md"
                    : "bg-background border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}

            <Select
              value={provinceFilter || "all"}
              onValueChange={(v) =>
                handleProvinceChange(v === "all" ? "" : v)
              }
            >
              <SelectTrigger className="w-[200px] rounded-full">
                <SelectValue placeholder="Semua Provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Provinsi</SelectItem>
                {provinces.map((prov) => (
                  <SelectItem key={prov} value={prov}>
                    {prov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive hover:text-destructive/80 gap-1 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground font-medium">
            Halaman {currentPage} dari {totalPages} ({totalDocs} kampus)
          </p>
        </div>

        {/* Grid */}
        {universities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {universities.map((uni) => (
              <Link
                key={uni.id}
                href={`/universitas/${uni.id}`}
                className="group block"
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-gsb-orange/40 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  {/* Logo */}
                  <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden flex items-center justify-center">
                    {uni.imageUrl ? (
                      <Image
                        src={uni.imageUrl}
                        alt={uni.name}
                        fill
                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                        <Building2 className="w-12 h-12" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {uni.abbreviation || "Kampus"}
                        </span>
                      </div>
                    )}
                    {uni.status && (
                      <div className="absolute top-3 right-3">
                        <Badge
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider shadow-md border-none",
                            uni.status === "negeri"
                              ? "bg-primary text-primary-foreground"
                              : uni.status === "swasta"
                                ? "bg-gsb-tosca text-primary-foreground"
                                : "bg-gsb-blue text-primary-foreground"
                          )}
                        >
                          {uni.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-[15px] text-foreground leading-snug mb-1 group-hover:text-gsb-orange transition-colors line-clamp-2">
                      {uni.name}
                    </h3>
                    {uni.abbreviation && (
                      <p className="text-xs text-gsb-orange font-semibold mb-3">
                        {uni.abbreviation}
                      </p>
                    )}

                    <div className="mt-auto space-y-2.5">
                      {uni.city && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-gsb-maroon" />
                          <span className="truncate">
                            {uni.city}
                            {uni.province ? `, ${uni.province}` : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">
                            {uni.programCount} Prodi
                          </span>
                        </div>
                        {uni.accreditation && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase bg-gsb-tosca/10 dark:bg-gsb-tosca/20 text-gsb-tosca border-none"
                          >
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {uni.accreditation}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Universitas Tidak Ditemukan
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tidak ada universitas yang cocok. Coba ubah kata kunci atau
              filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-6 gap-2 rounded-full"
            >
              <X className="w-4 h-4" /> Reset Filter
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() =>
                router.push(
                  buildUrl({ page: String(currentPage - 1) })
                )
              }
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {start > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(buildUrl({ page: "1" }))}
                  className="rounded-full w-10 h-10"
                >
                  1
                </Button>
                {start > 2 && (
                  <span className="text-muted-foreground px-1">…</span>
                )}
              </>
            )}

            {pageNumbers.map((n) => (
              <Button
                key={n}
                variant={n === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => router.push(buildUrl({ page: String(n) }))}
                className={cn(
                  "rounded-full w-10 h-10",
                  n === currentPage &&
                    "bg-gsb-maroon hover:bg-gsb-maroon/90 text-white"
                )}
              >
                {n}
              </Button>
            ))}

            {end < totalPages && (
              <>
                {end < totalPages - 1 && (
                  <span className="text-muted-foreground px-1">…</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(buildUrl({ page: String(totalPages) }))
                  }
                  className="rounded-full w-10 h-10"
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() =>
                router.push(
                  buildUrl({ page: String(currentPage + 1) })
                )
              }
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </nav>
        )}
      </section>
    </div>
  );
}
