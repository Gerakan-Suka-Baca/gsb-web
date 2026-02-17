"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Shield, User, Briefcase } from "lucide-react";

export default function TeamPage() {
    const team = [
        {
            role: "Pengawas",
            members: ["Nur Kholis Makki"],
            icon: <Shield className="w-6 h-6 text-gsb-red" />,
        },
        {
            role: "Pembina",
            members: ["Fajri Alfalah", "Ari Ismi Hidayah", "Muhammad Rifai"],
            icon: <User className="w-6 h-6 text-gsb-blue" />,
        },
        {
            role: "Pengurus Harian",
            members: [
                "Renita Yulistiana (Ketua)",
                "Annisa Dwinda Fatimah (Sekretaris)",
                "Astri Septiani (Bendahara Umum)",
                "Sinta Widyanisa (Bendahara)",
            ],
            icon: <Briefcase className="w-6 h-6 text-gsb-tosca" />,
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <section className="relative py-20 bg-muted/30 overflow-hidden">
                <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
                    <FadeIn direction="up">
                        <span className="inline-block py-1 px-3 rounded-full bg-gsb-orange/10 text-responsive-orange text-sm font-bold mb-4">Tim GSB</span>
                        <h1 className="text-4xl md:text-6xl font-heading font-bold text-responsive-maroon mb-6">
                            Orang di Balik <span className="text-responsive-orange">Layar</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Orang-orang hebat yang mendedikasikan waktu dan tenaga untuk keberlangsungan Yayasan Gema Simpul Berdaya.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <section id="tim" className="py-16 md:py-24">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {team.map((group, idx) => (
                            <FadeIn key={group.role} delay={idx * 0.1} className="flex flex-col items-center p-8 bg-background border border-border rounded-3xl hover:shadow-lg transition-all">
                                <div className="w-20 h-20 rounded-full bg-gsb-orange/10 flex items-center justify-center mb-6 text-gsb-orange">
                                    {group.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-responsive-maroon mb-6">{group.role}</h3>
                                <ul className="space-y-3 text-center w-full">
                                    {group.members.map((member) => (
                                        <li key={member} className="text-muted-foreground font-medium py-2 border-b border-border/50 last:border-0 w-full">
                                            {member}
                                        </li>
                                    ))}
                                </ul>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
