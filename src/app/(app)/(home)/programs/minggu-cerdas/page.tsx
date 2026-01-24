"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { BookOpen, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MingguCerdasPage() {
  const curriculum = [
    { week: "Pekan 1", topic: "Literasi Numerasi / TPS", desc: "Membangun logika matematika dan pemecahan masalah.", color: "bg-gsb-blue/10 text-gsb-blue" },
    { week: "Pekan 2", topic: "Literasi Sains / B. Indo", desc: "Eksperimen sederhana dan pemahaman teks.", color: "bg-gsb-tosca/10 text-gsb-tosca" },
    { week: "Pekan 3", topic: "Literasi B. Indonesia / Inggris", desc: "Kemampuan berbahasa dan komunikasi.", color: "bg-gsb-orange/10 text-gsb-orange" },
    { week: "Pekan 4", topic: "Literasi B. Inggris / Mat / Seni", desc: "Kreativitas dan pendalaman materi.", color: "bg-gsb-yellow/10 text-gsb-yellow-dark" },
  ];

  const phases = [
    { name: "Fase A", desc: "Kelas 1 (Belum lancar baca) & 2 SD" },
    { name: "Fase B", desc: "Kelas 3-4 SD" },
    { name: "Fase C", desc: "Kelas 5-6 SD" },
    { name: "Fase D", desc: "Kelas 7-9 SMP" },
    { name: "Fase E", desc: "Kelas 10-11 SMA" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="relative py-24 bg-gradient-to-br from-gsb-maroon to-gsb-red text-white overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
             <FadeIn direction="right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-gsb-yellow text-sm font-bold mb-6 border border-white/20">
                   <Users className="w-4 h-4" />
                   <span>Program Unggulan GSB</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight">
                   Minggu <span className="text-gsb-yellow">Cerdas</span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed max-w-xl mb-8">
                   Program bimbingan belajar gratis setiap hari Minggu untuk membantu anak-anak Indonesia mengejar ketertinggalan dan meraih prestasi.
                </p>
                <div className="flex flex-wrap gap-4">
                   <Button size="lg" className="bg-gsb-yellow text-gsb-maroon hover:bg-white font-bold rounded-full px-8 h-14 text-lg shadow-xl hover:scale-105 transition-all" asChild>
                      <Link href="#lokasi">Lihat Lokasi</Link>
                   </Button>
                   <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-gsb-maroon font-bold rounded-full px-8 h-14 text-lg bg-transparent" asChild>
                      <Link href="#kurikulum">Cek Kurikulum</Link>
                   </Button>
                </div>
             </FadeIn>
             
             <FadeIn direction="left" className="relative hidden lg:block">
                 <div className="relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex gap-4 mb-6">
                       <div className="w-12 h-12 rounded-xl bg-gsb-yellow flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gsb-maroon" />
                       </div>
                       <div>
                          <p className="font-bold text-xl">Siklus Pembelajaran</p>
                          <p className="text-white/70">Terstruktur & Menyenangkan</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       {[1,2,3,4].map((i) => (
                          <div key={i} className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
                             <div className="h-full bg-gsb-yellow w-[70%]" style={{ width: `${60 + i * 10}%` }} />
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="absolute top-10 right-10 w-20 h-20 bg-gsb-blue rounded-full blur-2xl opacity-50" />
                 <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gsb-yellow rounded-full blur-2xl opacity-30" />
             </FadeIn>
          </div>
        </div>
      </section>

      <section id="lokasi" className="py-20 lg:py-28">
         <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-heading font-bold text-gsb-maroon mb-6">Lokasi Belajar</h2>
               <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Kami hadir di titik-titik strategis untuk menjangkau mereka yang membutuhkan.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { 
                   place: "Sekolah Master Indonesia", 
                   city: "Depok", 
                   time: "10.00 - 12.00 WIB", 
                   level: "PAUD - SMA",
                   color: "border-gsb-blue" 
                 },
                 { 
                   place: "Masjid Al-Athiq", 
                   city: "Kab. Bogor", 
                   time: "10.00 - 12.00 WIB", 
                   level: "PAUD - SMP",
                   color: "border-gsb-tosca"  
                 },
                 { 
                   place: "Zoom Meeting", 
                   city: "Online", 
                   time: "Fleksibel", 
                   level: "Nasional",
                   color: "border-gsb-yellow"  
                 }
               ].map((loc, idx) => (
                  <FadeIn key={loc.place} delay={idx * 0.1} className={`bg-card p-8 rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all group ${loc.color}`}>
                     <div className="mb-6 bg-muted/50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-8 h-8 text-foreground" />
                     </div>
                     <h3 className="text-2xl font-bold text-gsb-maroon mb-2">{loc.place}</h3>
                     <p className="font-semibold text-gsb-orange mb-4">{loc.city}</p>
                     
                     <div className="space-y-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4" />
                           <span>{loc.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Users className="w-4 h-4" />
                           <span>{loc.level}</span>
                        </div>
                     </div>
                  </FadeIn>
               ))}
            </div>
         </div>
      </section>

      <section id="kurikulum" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <FadeIn className="order-2 lg:order-1">
                 <div className="grid gap-4">
                    {curriculum.map((item) => (
                       <div key={item.week} className="bg-background p-6 rounded-2xl border border-border flex gap-4 items-center hover:border-gsb-orange transition-colors">
                          <div className={`shrink-0 px-3 py-1 rounded-lg text-sm font-bold ${item.color}`}>
                             {item.week}
                          </div>
                          <div>
                             <h4 className="font-bold text-lg text-gsb-maroon">{item.topic}</h4>
                             <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </FadeIn>
              
              <FadeIn direction="left" className="order-1 lg:order-2 space-y-6">
                 <span className="text-gsb-orange font-bold tracking-wider uppercase">Kurikulum</span>
                 <h2 className="text-4xl font-heading font-bold text-gsb-maroon">Belajar yang Relevan & Menyenangkan</h2>
                 <p className="text-lg text-muted-foreground leading-relaxed">
                    Kami merancang siklus belajar bulanan yang variatif untuk memastikan siswa tidak bosan dan mendapatkan cakupan materi yang holistik, mulai dari numerasi, sains, bahasa, hingga seni.
                 </p>
                 <div className="pt-6">
                    <h3 className="font-bold text-lg mb-4">Pembagian Fase Kelas:</h3>
                    <div className="flex flex-wrap gap-2">
                       {phases.map((p) => (
                          <div key={p.name} className="px-4 py-2 bg-white rounded-lg border border-border shadow-sm text-sm">
                             <span className="font-bold text-gsb-maroon mr-2">{p.name}</span>
                             <span className="text-muted-foreground">{p.desc}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </FadeIn>
           </div>
        </div>
      </section>
    </div>
  );
}
