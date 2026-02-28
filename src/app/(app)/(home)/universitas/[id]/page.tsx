import { getPayloadCached } from "@/lib/payload";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, GraduationCap, Building2, BookOpen, ShieldAlert } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { UnivProgramListDropdown } from "@/modules/universitas/ui/components/UnivProgramListDropdown";
import type { University } from "@/payload-types";
import Image from "next/image";

export const revalidate = 300;

export default async function UniversitasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const db = await getPayloadCached();
  
  let universityData = await db.find({
    collection: "universities",
    where: { _id: { equals: unwrappedParams.id } },
    limit: 1,
    depth: 1,
  });

  if (universityData.docs.length === 0) {
    universityData = await db.find({
      collection: "universities",
      where: { slugField: { equals: unwrappedParams.id } },
      limit: 1,
      depth: 1,
    });
  }

  if (universityData.docs.length === 0) {
    const nameHint = unwrappedParams.id.replace(/-/g, " ");
    const candidates = await db.find({
      collection: "universities",
      where: { name: { contains: nameHint.split(" ").slice(0, 3).join(" ") } },
      limit: 10,
      depth: 1,
    });
    const toSlug = (v: string) =>
      v.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const match = (candidates.docs as University[]).find(
      (d) => toSlug(d.name || "") === unwrappedParams.id
    );
    if (match) {
      universityData = { ...candidates, docs: [match], totalDocs: 1 };
    }
  }

  const university = universityData.docs[0] as University | undefined;

  if (!university) {
    notFound();
  }

  const logoUrl = typeof university.image === 'object' && university.image?.url
    ? university.image.url
    : null;
  const coverImageUrl = typeof university.coverImage === 'object' && university.coverImage?.url
    ? university.coverImage.url
    : null;

  type ProgramItemForList = {
    id?: string;
    name?: string;
    level?: string;
    faculty?: string;
    category?: "snbt" | "snbp" | "mandiri";
    accreditation?: string;
    metrics?: Array<{
      year?: string;
      capacity?: number | null;
      applicants?: number | null;
      predictedApplicants?: number | null;
      admissionMetric?: string | null;
      passingPercentage?: string | null;
      avgUkt?: string | null;
      maxUkt?: string | null;
    }>;
  };
  const groupedPrograms: Record<string, ProgramItemForList[]> = {};

  const programsResult = await db.find({
    collection: "university-programs",
    where: { university: { equals: university.id } },
    limit: 500,
    depth: 0,
    pagination: false,
  });

  const programList = programsResult.docs;
  if (programList.length > 0) {
    programList.forEach((prog) => {
      const p = prog as unknown as {
        id?: string; name?: string; level?: string; faculty?: string;
        category?: "snbt" | "snbp" | "mandiri"; accreditation?: string;
        metrics?: Array<{
          year?: string;
          capacity?: number | null;
          applicants?: number | null;
          predictedApplicants?: number | null;
          admissionMetric?: string | null;
          passingPercentage?: string | null;
          avgUkt?: string | null;
          maxUkt?: string | null;
        }>;
      };
      const fac = p.faculty || "Fakultas Umum";
      if (!groupedPrograms[fac]) {
        groupedPrograms[fac] = [];
      }
      groupedPrograms[fac].push({
        id: p.id ? String(p.id) : undefined,
        name: p.name,
        level: p.level ?? undefined,
        faculty: p.faculty ?? undefined,
        category: p.category ?? undefined,
        accreditation: p.accreditation ?? undefined,
        metrics: Array.isArray(p.metrics)
          ? p.metrics.map((metric) => ({
              year: metric?.year ?? undefined,
              capacity: metric?.capacity ?? null,
              applicants: metric?.applicants ?? null,
              predictedApplicants: metric?.predictedApplicants ?? null,
              admissionMetric: metric?.admissionMetric ?? null,
              passingPercentage: metric?.passingPercentage ?? null,
              avgUkt: metric?.avgUkt ?? null,
              maxUkt: metric?.maxUkt ?? null,
            }))
          : undefined,
      });
    });
  }

  const faculties = Object.keys(groupedPrograms).sort();

  const hasDescription = university.description && 
                        typeof university.description === 'object' && 
                        Object.keys(university.description).length > 0;
                        
  const hasVisionMission = university.visionMission && 
                           typeof university.visionMission === 'object' && 
                           Object.keys(university.visionMission).length > 0;

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)] pb-12">
      <div className="relative h-64 md:h-80 w-full bg-slate-200 dark:bg-slate-900 overflow-hidden shadow-inner">
        {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={`${university.name} Banner`}
              fill
              sizes="100vw"
              className="object-cover object-center"
              unoptimized
            />
        ) : (
            <div className="w-full h-full bg-gradient-to-r from-gsb-maroon via-responsive-maroon to-gsb-orange flex items-center justify-center opacity-90 transition-all duration-700">
                <p className="text-white/30 font-bold text-lg sm:text-2xl tracking-[0.2em] flex items-center gap-3">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 opacity-40" />
                    UNIVERSITAS DATA
                </p>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent md:via-background/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 z-10 w-full mb-12">
        <div className="bg-card dark:bg-slate-900 rounded-2xl shadow-xl border border-border p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start mb-8 backdrop-blur-xl">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-slate-800 rounded-2xl shadow-md border-4 border-slate-50 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative group">
                {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`Logo ${university.name}`}
                      fill
                      sizes="160px"
                      className="object-contain p-2 w-full h-full group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center text-muted-foreground/50">
                        <Building2 className="w-16 h-16 mb-2 opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                    </div>
                )}
            </div>
            
            <div className="flex-1 w-full pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-foreground tracking-tight leading-tight">
                            {university.name}
                        </h1>
                        {university.abbreviation && (
                            <p className="text-xl text-gsb-orange font-medium mt-1 tracking-wide">{university.abbreviation}</p>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        {university.status && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none uppercase px-3 py-1 text-xs font-bold tracking-wider shadow-sm">
                                {university.status}
                            </Badge>
                        )}
                        {university.accreditation && (
                            <Badge className="bg-gsb-tosca/10 text-gsb-tosca/90 hover:bg-gsb-tosca/20 border-none uppercase px-3 py-1 text-xs font-bold tracking-wider shadow-sm flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Akreditasi {university.accreditation}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-foreground">
                    {university.address && (
                        <div className="flex items-start gap-3 bg-card p-3 rounded-lg border border-border">
                            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed">{university.address}</p>
                        </div>
                    )}
                    {university.website && (
                        <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border">
                            <Globe className="w-5 h-5 text-gsb-blue shrink-0" />
                            <a href={(university.website as string).startsWith('http') ? (university.website as string) : `https://${university.website as string}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gsb-blue hover:underline transition-colors truncate">
                                {university.website}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-sm border-border bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="h-1.5 w-full bg-gradient-to-r from-gsb-maroon to-gsb-orange" />
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-xl flex items-center gap-2.5 text-foreground">
                            <Building2 className="w-5 h-5 text-gsb-orange" />
                            Tentang Kampus
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {hasDescription && _isEmptyRichText(university.description) === false ? (
                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                                <RichText content={university.description} />
                            </div>
                        ) : (
                            <div className="bg-muted/30 rounded-xl p-8 text-center border border-dashed border-border text-muted-foreground flex flex-col items-center justify-center h-full min-h-[150px]">
                                <div className="bg-background p-3 rounded-full shadow-sm mb-3">
                                    <Building2 className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <p className="font-semibold text-foreground">Belum Tersedia</p>
                                <p className="text-xs mt-1">Sistem sedang memproses data untuk kampus ini.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-border bg-card rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="h-1.5 w-full bg-primary" />
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-xl flex items-center gap-2.5 text-foreground">
                            <LightbulbIcon className="w-5 h-5 text-primary" />
                            Visi dan Misi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {hasVisionMission && _isEmptyRichText(university.visionMission) === false ? (
                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                                <RichText content={university.visionMission} />
                            </div>
                        ) : (
                             <div className="bg-muted/30 rounded-xl p-8 text-center border border-dashed border-border flex flex-col items-center justify-center h-full min-h-[150px]">
                                <div className="bg-background p-3 rounded-full shadow-sm mb-3">
                                    <LightbulbIcon className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <p className="font-semibold text-foreground">Visi Misi Kosong</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="w-full">
                <Card className="shadow-md bg-card border-border rounded-2xl overflow-hidden h-full">
                    <div className="h-1.5 w-full bg-gsb-orange" />
                    <CardHeader className="bg-muted/10 border-b border-border rounded-t-2xl px-6 py-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4">
                            <GraduationCap className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3 font-heading tracking-tight mb-2 text-foreground">
                                <BookOpen className="w-7 h-7 text-gsb-orange" />
                                Daftar Program Studi
                            </CardTitle>
                            <CardDescription className="text-muted-foreground text-sm sm:text-base">
                                Temukan program studi impianmu, lengkap dengan data keketatan SNBT/SNBP, prediksi peminat, skor aman UTBK, dan estimasi UKT. Data ditarik secara real-time.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 bg-muted/10">
                        <UnivProgramListDropdown faculties={faculties} groupedPrograms={groupedPrograms} />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

function SchoolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
      <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
      <path d="M18 5v17" />
      <path d="m4 6 8-4 8 4" />
      <path d="M6 5v17" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  )
}

function LightbulbIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

function _isEmptyRichText(rt: unknown) {
  if (!rt || typeof rt !== "object") return true;
  const root = (rt as { root?: { children?: Array<{ children?: unknown[] }> } }).root;
  if (root?.children?.length === 0) return true;
  if (root?.children?.length === 1 && root.children[0].children?.length === 0) return true;
  return false;
}
