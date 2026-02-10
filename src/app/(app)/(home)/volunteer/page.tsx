"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { Heart, Users, Coffee, Zap, Mic } from "lucide-react";
import Link from "next/link";

export default function VolunteerPage() {
  const culture = [
    {
      title: "Sama-sama Belajar",
      desc: "Tidak ada yang 'paling bisa'. Kita saling menguatkan, bukan menggurui.",
      icon: <Users className="w-6 h-6 text-gsb-blue" />,
    },
    {
      title: "Berani Bersuara",
      desc: "Ide, kritik, dan keluhan wajib disampaikan. Kami mendengar tanpa menghakimi.",
      icon: <Mic className="w-6 h-6 text-gsb-orange" />,
    },
    {
      title: "No Toxic & Setara",
      desc: "Zero tolerance untuk diskriminasi atau kekerasan. Keamanan (Safeguarding) adalah prioritas.",
      icon: <Heart className="w-6 h-6 text-gsb-red" />,
    },
    {
      title: "Hari Haram Tugas",
      desc: "Senin-Rabu adalah waktu istirahat mutlak (libur) untuk recharge energi.",
      icon: <Coffee className="w-6 h-6 text-gsb-tosca" />,
    },
  ];

  return (
    <div className="w-full bg-background">
      <section className="relative py-20 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <FadeIn direction="up">
            <span className="inline-block py-1 px-3 rounded-full bg-gsb-red/10 text-gsb-red text-sm font-bold mb-4 tracking-wider uppercase">Open Recruitment</span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-gsb-maroon dark:text-white mb-6">
              Gabung <span className="text-gsb-orange">Geng Suba</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Jadilah bagian dari perubahan. Bergabunglah dengan 4.000+ relawan yang telah bergerak berdampak untuk pendidikan Indonesia.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" className="rounded-full bg-gsb-orange hover:bg-gsb-orange/90 text-white px-8 h-12 text-lg shadow-lg hover:scale-105 transition-all" asChild>
                <Link href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a" target="_blank">Daftar Relawan</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gsb-maroon dark:text-white mb-4">Budaya Kami</h2>
            <p className="text-muted-foreground">Lingkungan relawan yang suportif, seru, dan bertumbuh.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {culture.map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.1} className="bg-card border border-border p-6 rounded-2xl hover:shadow-md transition-all">
                <div className="mb-4 bg-muted w-12 h-12 rounded-full flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gsb-maroon dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gsb-maroon text-white text-center">
        <div className="container mx-auto px-4">
          <Zap className="w-12 h-12 mx-auto mb-6 text-gsb-yellow" />
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Siap Berdampak?</h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            &quot;Kebaikan yang dilakukan dengan bahagia akan bertahan lama.&quot;
          </p>
          <Button size="lg" className="rounded-full bg-gsb-yellow text-gsb-maroon hover:bg-white font-bold px-10 h-14 text-xl shadow-xl transition-all hover:scale-105" asChild>
            <Link href="https://www.indorelawan.org/organization/5c07e2741c15322842719f0a" target="_blank">Daftar Sekarang</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
