"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Users, Target, Heart, Lightbulb, User, Shield, Briefcase } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  const philosophy = [
    {
      term: "Gema",
      desc: "Suara perubahan yang lahir dari aksi kecil dan bergulir menjadi dampak besar.",
      icon: <Target className="w-8 h-8 text-gsb-orange" />,
    },
    {
      term: "Simpul",
      desc: "Jaringan relawan, individu, dan lembaga yang saling terhubung.",
      icon: <Users className="w-8 h-8 text-gsb-blue" />,
    },
    {
      term: "Berdaya",
      desc: "Tujuan akhir, yaitu kemandirian dan kesadaran diri untuk mengambil peran dalam perubahan.",
      icon: <Lightbulb className="w-8 h-8 text-gsb-yellow" />,
    },
  ];

  const values = [
    "Kesetaraan",
    "Kolaborasi",
    "Kemandirian",
    "Kontekstual",
    "Kegembiraan (Fun)",
  ];

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
    <div className="min-h-screen bg-background">
      <section className="relative py-20 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <FadeIn direction="up">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-gsb-maroon dark:text-gsb-yellow mb-6">
              Tentang <span className="text-gsb-orange">Kami</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Yayasan Gema Simpul Berdaya (GSB) adalah organisasi nirlaba yang bergerak untuk mewujudkan
              ekosistem pembelajaran yang berpihak, relevan, dan berkelanjutan.
            </p>
          </FadeIn>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gsb-yellow/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gsb-blue/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
      </section>

      <section id="profile" className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn direction="right" className="space-y-6">
              <h2 className="text-3xl font-heading font-bold text-gsb-maroon dark:text-gsb-yellow">
                Perjalanan <span className="text-gsb-orange">9 Tahun</span> GSB
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Berdiri sejak <strong>16 Oktober 2016</strong>, GSB bermula sebagai komunitas non-profit
                sederhana. Didorong oleh tagline <em>&quot;Bergerak Berdampak untuk Pendidikan&quot;</em>, kami terus tumbuh
                untuk menjawab tantangan pendidikan yang seharusnya IMBANG, bukan TIMPANG.
              </p>
              <div className="bg-gsb-orange/5 p-6 rounded-2xl border-l-4 border-gsb-orange">
                <p className="italic text-gsb-maroon dark:text-gsb-yellow font-medium">
                  &quot;From Access to Impact: Education for All&quot;
                </p>
              </div>
            </FadeIn>
            <FadeIn direction="left">
               <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-muted">
                  <Image
                    src="/home/about/kelasbogor.jpg"
                    alt="Kegiatan GSB"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <p className="font-heading font-bold text-xl">Komunitas Gerakan Suka Baca</p>
                    <p className="text-sm opacity-90">Sejak 2016</p>
                  </div>
               </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section id="makna" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-gsb-maroon dark:text-gsb-yellow mb-4">Filosofi Nama</h2>
            <div className="h-1 w-20 bg-gsb-orange mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {philosophy.map((item, idx) => (
              <FadeIn key={item.term} delay={idx * 0.1} className="bg-background p-8 rounded-3xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="mb-6 bg-muted/50 w-16 h-16 rounded-2xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-heading font-bold text-gsb-maroon dark:text-gsb-yellow mb-3">{item.term}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="visi-misi" className="py-16 md:py-24 bg-gsb-maroon text-white relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <FadeIn direction="right" className="space-y-6">
              <h2 className="text-3xl font-heading font-bold text-gsb-yellow mb-6">Visi & Misi</h2>
              <div>
                <h3 className="text-xl font-bold mb-2">Visi</h3>
                <p className="text-white/80 leading-relaxed">
                  Mewujudkan ekosistem pembelajaran yang berpihak, relevan, dan berkelanjutan bagi setiap individu untuk tumbuh dan berdaya.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Misi</h3>
                <ul className="space-y-2 text-white/80 list-disc list-inside">
                  <li>Mengembangkan Ruang Belajar berbasis komunitas.</li>
                  <li>Konektivitas relawan, individu, dan lembaga.</li>
                  <li>Pembelajaran Kontekstual yang dekat dengan kehidupan.</li>
                  <li>Inovasi & Riset sosial berbasis pengalaman.</li>
                  <li>Lintas Generasi sebagai ruang tumbuh kapasitas.</li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn direction="left" className="space-y-6">
               <h2 className="text-3xl font-heading font-bold text-gsb-yellow mb-6">Nilai Utama</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {values.map((val, idx) => (
                   <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-colors">
                     <Heart className="w-5 h-5 text-gsb-pink fill-gsb-pink" />
                     <span className="font-medium text-lg">{val}</span>
                   </div>
                 ))}
               </div>
            </FadeIn>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/home/texture.png')] opacity-10 mix-blend-overlay" />
      </section>

      <section id="tim" className="py-16 md:py-24">
         <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-heading font-bold text-gsb-maroon dark:text-gsb-yellow mb-4">Struktur Organisasi</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Orang-orang hebat yang mendedikasikan waktu dan tenaga untuk keberlangsungan Yayasan Gema Simpul Berdaya.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {team.map((group, idx) => (
                 <FadeIn key={group.role} delay={idx * 0.1} className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gsb-orange/10 flex items-center justify-center mb-6 text-gsb-orange">
                       {group.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gsb-maroon dark:text-gsb-yellow mb-4">{group.role}</h3>
                    <ul className="space-y-2 text-center">
                       {group.members.map((member) => (
                         <li key={member} className="text-muted-foreground font-medium">
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
