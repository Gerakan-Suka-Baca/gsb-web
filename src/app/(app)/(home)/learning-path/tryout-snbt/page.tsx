"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    BookOpen,
    Clock,
    BarChart,
    Brain,
    Calculator,
    Languages,
    AlertCircle,
    ArrowRight,
    PenTool,
    Sigma,
    Globe,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function TryoutSNBTPage() {
    const subtests = [
        {
            title: "Penalaran Umum",
            desc: "Menguji logika induktif, deduktif, dan kuantitatif.",
            icon: <Brain className="w-6 h-6" />,
            color: "text-gsb-blue",
            bg: "bg-gsb-blue/10",
            count: "30 Soal",
        },
        {
            title: "Pengetahuan & Pemahaman Umum",
            desc: "Menguji kemampuan memahami bahasa, sinonim, dan makna kata.",
            icon: <BookOpen className="w-6 h-6" />,
            color: "text-gsb-orange",
            bg: "bg-gsb-orange/10",
            count: "20 Soal",
        },
        {
            title: "Pemahaman Bacaan & Menulis",
            desc: "Menguji kemampuan memahami bacaan, memperbaiki kalimat, dan ejaan.",
            icon: <PenTool className="w-6 h-6" />,
            color: "text-gsb-red",
            bg: "bg-gsb-red/10",
            count: "20 Soal",
        },
        {
            title: "Pengetahuan Kuantitatif",
            desc: "Menguji matematika dasar (aljabar, geometri, statistika, peluang).",
            icon: <Sigma className="w-6 h-6" />,
            color: "text-gsb-tosca",
            bg: "bg-gsb-tosca/10",
            count: "20 Soal",
        },
        {
            title: "Literasi Bahasa Indonesia",
            desc: "Menguji kemampuan memahami bacaan panjang/berita.",
            icon: <Languages className="w-6 h-6" />,
            color: "text-gsb-blue",
            bg: "bg-gsb-blue/10",
            count: "30 Soal",
        },
        {
            title: "Literasi Bahasa Inggris",
            desc: "Menguji kemampuan memahami bacaan dalam bahasa Inggris.",
            icon: <Globe className="w-6 h-6" />,
            color: "text-gsb-orange",
            bg: "bg-gsb-orange/10",
            count: "20 Soal",
        },
        {
            title: "Penalaran Matematika",
            desc: "Menguji penerapan konsep matematika dalam pemecahan masalah.",
            icon: <Calculator className="w-6 h-6" />,
            color: "text-gsb-red",
            bg: "bg-gsb-red/10",
            count: "20 Soal",
        },
    ];

    const features = [
        {
            title: "Sistem IRT",
            desc: "Penilaian menggunakan Item Response Theory, sesuai standar SNPMB.",
            icon: <BarChart className="w-5 h-5 text-gsb-blue" />,
        },
        {
            title: "Blocking Time",
            desc: "Waktu pengerjaan per subtes dibatasi, melatih manajemen waktu.",
            icon: <Clock className="w-5 h-5 text-gsb-orange" />,
        },

    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-muted/30 overflow-hidden">
                <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
                    <FadeIn direction="up">
                        <Badge variant="outline" className="mb-4 text-gsb-orange border-gsb-orange">
                            Tryout SNBT 2026
                        </Badge>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-gsb-maroon mb-6 leading-tight">
                            Siap Taklukan <span className="text-gsb-orange">UTBK?</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                            Simulasi ujian berbasis komputer dengan sistem penilaian IRT dan blocking time yang dirancang semirip mungkin dengan aslinya.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                asChild
                                size="lg"
                                className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full px-8 h-12 text-lg shadow-lg hover:scale-105 transition-all"
                            >
                                <Link href="/tryout">Mulai Tryout Gratis</Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="border-2 border-gsb-blue text-gsb-blue font-semibold rounded-full px-8 h-12 text-lg hover:bg-gsb-blue hover:text-white transition-all"
                            >
                                <Link href="#subtests">Cakupan Materi</Link>
                            </Button>
                        </div>
                    </FadeIn>
                </div>

                {/* Background Elements */}
                <div className="absolute top-1/2 left-10 w-32 h-32 bg-gsb-yellow/20 rounded-full blur-2xl -translate-y-1/2" />
                <div className="absolute top-1/4 right-10 w-48 h-48 bg-gsb-tosca/10 rounded-full blur-3xl" />
            </section>

            {/* Subtests Section */}
            <section id="subtests" className="py-20">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center mb-16">
                        <FadeIn direction="up">
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-4">
                                Materi yang Diujikan
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Kuasai 7 subtes utama untuk memaksimalkan skormu.
                            </p>
                        </FadeIn>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                        {subtests.map((item, idx) => (
                            <FadeIn
                                key={item.title}
                                delay={idx * 0.1}
                                className="w-[calc(50%-0.5rem)] md:w-[calc(25%-1.5rem)] p-4 md:p-6 rounded-2xl bg-card border border-border hover:border-gsb-orange/50 transition-all hover:shadow-lg group flex flex-col"
                            >
                                <div
                                    className={`${item.bg} w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}
                                >
                                    <span className={`${item.color}`}>{item.icon}</span>
                                </div>
                                <h3 className="text-sm md:text-xl font-bold text-foreground mb-2 leading-tight">
                                    {item.title}
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 leading-relaxed hidden md:block">
                                    {item.desc}
                                </p>
                                <Badge variant="secondary" className="text-[10px] md:text-xs font-medium mt-auto w-fit">
                                    {item.count}
                                </Badge>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features & Rules Section */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Features Left */}
                        <div className="space-y-8">
                            <FadeIn direction="right">
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-6">
                                    Mengapa Tryout di GSB?
                                </h2>
                                <div className="space-y-6">
                                    {features.map((feature) => (
                                        <div key={feature.title} className="flex gap-4">
                                            <div className="shrink-0 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-lg">
                                                    {feature.title}
                                                </h4>
                                                <p className="text-muted-foreground">
                                                    {feature.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>

                        {/* Rules Accordion Right */}
                        <div className="bg-card rounded-3xl p-6 lg:p-8 border border-border shadow-sm">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-gsb-blue" />
                                Ketentuan Mengerjakan
                            </h3>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Persiapan Perangkat</AccordionTrigger>
                                    <AccordionContent>
                                        Gunakan Laptop/PC untuk pengalaman terbaik. Pastikan koneksi internet stabil.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Sistem Waktu</AccordionTrigger>
                                    <AccordionContent>
                                        Waktu setiap subtes dibatasi (Blocking Time). Kamu tidak bisa kembali ke subtes sebelumnya jika waktu habis.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Penilaian</AccordionTrigger>
                                    <AccordionContent>
                                        Skor menggunakan sistem IRT (Item Response Theory). Bobot soal berbeda-beda tergantung tingkat kesulitan dan jawaban peserta lain.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>Hasil & Pembahasan</AccordionTrigger>
                                    <AccordionContent>
                                        Hasil tryout dapat diakses H+1 setelah periode ujian berakhir. Pembahasan lengkap tersedia dalam format PDF dan Video.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4">
                    <FadeIn direction="up">
                        <h2 className="text-3xl font-heading font-bold text-gsb-maroon mb-6">Sudah Siap Menguji Kemampuan?</h2>
                        <Button
                            asChild
                            size="lg"
                            className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full px-10 h-14 text-lg shadow-xl"
                        >
                            <Link href="/tryout">Daftar Tryout Sekarang <ArrowRight className="ml-2 w-5 h-5" /></Link>
                        </Button>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
