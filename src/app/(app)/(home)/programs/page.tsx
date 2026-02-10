"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { BookOpen, MapPin, Calendar, Star, Compass, Database, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProgramsPage() {
  const curriculum = [
    { week: "Pekan 1", topic: "Literasi Numerasi / TPS", color: "bg-gsb-blue/10 text-gsb-blue" },
    { week: "Pekan 2", topic: "Literasi Sains / B. Indo", color: "bg-gsb-tosca/10 text-gsb-tosca" },
    { week: "Pekan 3", topic: "Literasi B. Indonesia / Inggris", color: "bg-gsb-orange/10 text-gsb-orange" },
    { week: "Pekan 4", topic: "Literasi B. Inggris / Mat / Seni", color: "bg-gsb-yellow/10 text-gsb-yellow-dark" },
  ];

  const phases = [
    { name: "Fase A", desc: "Kelas 1 (Belum lancar baca) & 2 SD" },
    { name: "Fase B", desc: "Kelas 3-4 SD" },
    { name: "Fase C", desc: "Kelas 5-6 SD" },
    { name: "Fase D", desc: "Kelas 7-9 SMP" },
    { name: "Fase E", desc: "Kelas 10-11 SMA" },
    { name: "Khusus", desc: "PAUD, ABK (Pelita), NextGen (Kls 12)" },
  ];

  const careducation = [
    {
      title: "Suba Expedition",
      desc: "Fun Worksheet Adventure. Belajar membaca sambil bertualang untuk anak usia dini.",
      icon: <Compass className="w-8 h-8" />,
      color: "text-gsb-blue",
      bg: "bg-gsb-blue/10",
    },
    {
      title: "Suba Mission",
      desc: "Your Path to Campus. Modul aksesibel dan Try Out SNBT terjangkau.",
      icon: <Star className="w-8 h-8" />,
      color: "text-gsb-orange",
      bg: "bg-gsb-orange/10",
    },
    {
      title: "Suba Skill Lab",
      desc: "Explore. Learn. Grow. Ruang eksplorasi soft skill dan teknologi.",
      icon: <Database className="w-8 h-8" />,
      color: "text-gsb-tosca",
      bg: "bg-gsb-tosca/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <FadeIn direction="up">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-gsb-maroon dark:text-white mb-6">
              Program <span className="text-gsb-orange">Kami</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Beragam inisiatif pendidikan untuk menjembatani kesenjangan akses dan kualitas belajar.
            </p>
          </FadeIn>
        </div>
      </section>

      <section id="minggu-cerdas" className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="mb-12">
            <span className="inline-block py-1 px-3 rounded-full bg-gsb-orange/10 text-gsb-orange text-sm font-bold mb-4">Program Unggulan</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon dark:text-white mb-6">Minggu Cerdas</h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Program pembelajaran tambahan bebas biaya yang dilaksanakan setiap hari Minggu dengan kurikulum yang menyenangkan dan relevan.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <FadeIn className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-6">
                <MapPin className="w-8 h-8 text-gsb-red" />
                <h3 className="text-2xl font-bold text-gsb-maroon dark:text-white">Lokasi Belajar</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-2 h-full bg-gsb-blue rounded-full shrink-0" />
                  <div>
                    <p className="font-bold text-lg">Sekolah Master Indonesia</p>
                    <p className="text-muted-foreground">Depok • Minggu, 10.00 - 12.00 WIB</p>
                    <p className="text-sm text-gsb-blue mt-1">Jenjang PAUD s.d. SMA</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-2 h-full bg-gsb-tosca rounded-full shrink-0" />
                  <div>
                    <p className="font-bold text-lg">Masjid Al-Athiq, Sasakpanjang</p>
                    <p className="text-muted-foreground">Kab. Bogor • Minggu, 10.00 - 12.00 WIB</p>
                    <p className="text-sm text-gsb-tosca mt-1">Jenjang PAUD s.d. SMP</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-2 h-full bg-gsb-yellow rounded-full shrink-0" />
                  <div>
                    <p className="font-bold text-lg">Online (Zoom)</p>
                    <p className="text-muted-foreground">Untuk siswa luar wilayah</p>
                  </div>
                </li>
              </ul>
            </FadeIn>

            <FadeIn delay={0.2} className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-8 h-8 text-gsb-orange" />
                <h3 className="text-2xl font-bold text-gsb-maroon dark:text-white">Kurikulum Bulanan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {curriculum.map((item) => (
                  <div key={item.week} className="p-4 rounded-xl border border-border/50 bg-background hover:shadow-md transition-all">
                    <p className={`text-sm font-bold mb-1 px-2 py-0.5 rounded-md w-fit ${item.color}`}>{item.week}</p>
                    <p className="font-medium text-foreground">{item.topic}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <div className="bg-muted/30 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-center mb-8">Kelas Sesuai Kemampuan (Fase)</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {phases.map((phase) => (
                <div key={phase.name} className="bg-background px-6 py-3 rounded-full shadow-sm border border-border flex flex-col items-center">
                  <span className="font-heading font-bold text-gsb-maroon">{phase.name}</span>
                  <span className="text-xs text-muted-foreground">{phase.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="careducation" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <span className="text-gsb-tosca font-bold tracking-wider uppercase text-sm">Social Enterprise</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon dark:text-white mt-2 mb-6">Careducation Movement</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Inovasi keberlanjutan untuk menjembatani akses pendidikan melalui produk dan layanan edukatif.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {careducation.map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.1} className="p-8 rounded-3xl bg-background border border-border hover:border-gsb-tosca/50 transition-colors group">
                <div className={`${item.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <span className={`${item.color}`}>{item.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-gsb-maroon dark:text-white mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="pendukung" className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-6">
          <h2 className="text-3xl font-heading font-bold text-gsb-maroon dark:text-white mb-12 text-center">Program Pendukung</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Beasiswa Minggu Cerdas", desc: "Bantuan biaya pendidikan parsial berbasis seleksi Project Based Learning.", icon: Star },
              { title: "Lapak Baca", desc: "Literasi outdoor di Taman Lembah Gurame, Depok (Minggu Sore).", icon: BookOpen },
              { title: "Wisata Edukasi", desc: "Jalan-jalan apresiasi ke museum/tempat wisata tahunan.", icon: Compass },
              { title: "Ngobrolin Buku", desc: "Sesi diskusi buku rutin memperkuat budaya literasi.", icon: Users },
            ].map((prog) => (
              <FadeIn key={prog.title} className="bg-muted/30 p-6 rounded-2xl hover:bg-muted/50 transition-colors">
                <prog.icon className="w-8 h-8 text-gsb-maroon mb-4" />
                <h3 className="font-bold text-lg mb-2">{prog.title}</h3>
                <p className="text-sm text-muted-foreground">{prog.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gsb-orange text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Tertarik Berkolaborasi?</h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto mb-10">
            Mari bersama-sama menciptakan dampak yang lebih luas bagi pendidikan Indonesia.
          </p>
          <Button size="lg" variant="secondary" asChild className="rounded-full px-8 h-12 text-gsb-orange font-bold text-lg hover:bg-white hover:scale-105 transition-all">
            <Link href="/volunteer">Gabung Sekarang</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
