"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Code,
    Database,
    User,
    PenTool,
    ArrowRight,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function LearningPathPage() {
    const paths = [
        {
            title: "Kelas FrontEnd",
            desc: "Belajar web development dari dasar hingga mahir dengan kurikulum industri.",
            icon: <Code className="w-6 h-6" />,
            color: "text-gsb-blue",
            bg: "bg-gsb-blue/10",
            url: "/learning-path/frontend-class",
            status: "Coming Soon"
        },
        {
            title: "Kelas Data Science",
            desc: "Pelajari analisis data, machine learning, dan visualisasi data modern.",
            icon: <Database className="w-6 h-6" />,
            color: "text-gsb-orange",
            bg: "bg-gsb-orange/10",
            url: "/learning-path/data-science",
            status: "Coming Soon"
        },
        {
            title: "Kelas Self Development",
            desc: "Tingkatkan soft skill dan pengembangan diri untuk karir yang cemerlang.",
            icon: <User className="w-6 h-6" />,
            color: "text-gsb-red",
            bg: "bg-gsb-red/10",
            url: "/learning-path/self-development",
            status: "Coming Soon"
        },
        {
            title: "Tryout SNBT",
            desc: "Simulasi ujian SNBT dengan sistem IRT dan Blocking Time sesuai standar terbaru.",
            icon: <PenTool className="w-6 h-6" />,
            color: "text-gsb-tosca",
            bg: "bg-gsb-tosca/10",
            url: "/learning-path/tryout-snbt",
            status: "Available"
        },
    ];



    const steps = [
        {
            num: "01",
            title: "Pilih Jalur Belajar",
            desc: "Tentukan fokus belajarmu, mulai dari programming hingga persiapan PTN.",
        },
        {
            num: "02",
            title: "Akses Materi & Mentor",
            desc: "Pelajari modul interaktif dan dapatkan bimbingan langsung.",
        },
        {
            num: "03",
            title: "Kerjakan Projek / Tryout",
            desc: "Uji pemahamanmu melalui real-world project atau simulasi ujian.",
        },
        {
            num: "04",
            title: "Raih Tujuanmu",
            desc: "Dapatkan sertifikat kompetensi atau skor impianmu.",
        },
    ];

    const faqs = [
        {
            q: "Apakah pemula bisa mengikuti program ini?",
            a: "Tentu saja! Kurikulum kami dirancang mulai dari tingkat dasar (beginner friendly) hingga mahir.",
        },
        {
            q: "Bagaimana sistem belajarnya?",
            a: "Pembelajaran dilakukan secara campuran (blended learning) dengan video materi, live session, dan tugas mandiri.",
        },
        {
            q: "Apakah mendapatkan sertifikat?",
            a: "Ya, peserta yang menyelesaikan seluruh materi dan tugas akhir akan mendapatkan sertifikat kompetensi.",
        },
    ];


    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-muted/30 overflow-hidden">
                <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
                    <FadeIn direction="up">
                        <Badge variant="outline" className="mb-4 text-gsb-orange border-gsb-orange">
                            Learning Path
                        </Badge>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-gsb-maroon mb-6 leading-tight">
                            Pilih Jalur <span className="text-gsb-orange">Belajarmu</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                            Temukan program belajar yang dirancang khusus untuk membantumu berkembang, dari skill teknis hingga persiapan ujian masuk perguruan tinggi.
                        </p>
                    </FadeIn>
                </div>
                {/* Background Elements */}
                <div className="absolute top-1/2 left-10 w-32 h-32 bg-gsb-yellow/20 rounded-full blur-2xl -translate-y-1/2" />
                <div className="absolute top-1/4 right-10 w-48 h-48 bg-gsb-tosca/10 rounded-full blur-3xl" />
            </section>

            {/* How It Works */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-4">
                            Cara Memulai
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        {steps.map((step, idx) => (
                            <FadeIn key={step.num} delay={idx * 0.1} className="relative">
                                <div className="text-5xl font-bold text-gsb-orange/10 mb-4 font-heading">{step.num}</div>
                                <h3 className="text-xl font-bold mb-2 absolute top-8 left-0">{step.title}</h3>
                                <p className="text-muted-foreground mt-12">{step.desc}</p>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Paths Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {paths.map((item, idx) => (
                            <FadeIn
                                key={item.title}
                                delay={idx * 0.1}
                                className="p-8 rounded-3xl bg-card border border-border hover:border-gsb-orange/50 transition-all hover:shadow-xl group relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className={`${item.bg} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                                    >
                                        <span className={`${item.color}`}>{item.icon}</span>
                                    </div>
                                    <Badge variant={item.status === "Available" ? "default" : "secondary"} className={item.status === "Available" ? "bg-gsb-green hover:bg-gsb-green/90" : ""}>
                                        {item.status}
                                    </Badge>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                                    {item.desc}
                                </p>
                                <Button
                                    asChild
                                    variant={item.status === "Available" ? "default" : "outline"}
                                    className={`w-full h-12 rounded-xl text-lg font-semibold ${item.status === "Available" ? "bg-gsb-orange hover:bg-gsb-orange/90 text-white shadow-lg" : ""}`}
                                    disabled={item.status !== "Available"}
                                >
                                    <Link href={item.url}>
                                        {item.status === "Available" ? "Mulai Belajar" : "Segera Hadir"}
                                        {item.status === "Available" && <ArrowRight className="ml-2 w-5 h-5" />}
                                    </Link>
                                </Button>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-background max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-heading font-bold text-gsb-maroon mb-4">
                        Pertanyaan Umum
                    </h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, idx) => (
                        <AccordionItem key={idx} value={`item-${idx}`}>
                            <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
        </div>
    );
}
