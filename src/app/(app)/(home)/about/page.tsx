"use client";

import { useState } from "react";
import { FadeIn } from "@/components/ui/fade-in";
import { Users, Target, Heart, Lightbulb, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export default function AboutPage() {
  const [showAllBudaya, setShowAllBudaya] = useState(false);
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

  const budayaItems = [
    { title: "Sama-sama Belajar, Sama-sama Tumbuh", desc: "Ruang saling menguatkan dan berbagi pengetahuan. Gak ada yang sok paling bisa." },
    { title: "Berani Berkomunikasi", desc: "Punya ide atau kendala? Sampaikan. Tiap suara layak didengar." },
    { title: "Saling Menghargai", desc: "Hormati waktu dan ruang pribadi rekan. Tanggung jawab dengan tugas masing-masing." },
    { title: "Semua SAMA dan SETARA", desc: "Tidak ada diskriminasi. Semua layak dihargai tanpa memandang latar belakang." },
    { title: "Kepala Dingin", desc: "Salah paham? Konflik? Yuk ngobrol baik-baik cari solusi." },
    { title: "Hak Beristirahat", desc: "Senin–Rabu adalah 'Hari Haram Tugas'. Recharge energi itu penting!" },
    { title: "Ruang Aman", desc: "Pelecehan, kekerasan, dan diskriminasi = BIG NO." },
    { title: "Bersama, Bukan Sendiri", desc: "Saling dukung antar divisi demi satu tujuan akses pendidikan yang adil." },
    { title: "Berbagi Buku & Cerita", desc: "Sesi sharing buku dan Budaya Baca 20 menit sebelum acara." },
    { title: "Refleksi & Apresiasi", desc: "Setiap relawan berhak memberi dan menerima masukan serta apresiasi." },
  ];

  const displayedBudaya = showAllBudaya ? budayaItems : budayaItems.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 md:py-16 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-left">
          <FadeIn direction="up">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-responsive-maroon mb-6">
              Tentang <span className="text-responsive-orange">Kami</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Yayasan Gema Simpul Berdaya (GSB) adalah organisasi nirlaba yang bergerak untuk mewujudkan
              ekosistem pembelajaran yang berpihak, relevan, dan berkelanjutan.
            </p>
          </FadeIn>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gsb-yellow/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gsb-blue/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
      </section>

      <section id="profile" className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn direction="right" className="space-y-6">
              <h2 className="text-3xl font-heading font-bold text-responsive-maroon">
                Perjalanan <span className="text-responsive-orange">9 Tahun</span> GSB
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Berdiri sejak <strong>16 Oktober 2016</strong>, GSB bermula sebagai komunitas non-profit
                sederhana. Didorong oleh tagline <em>&quot;Bergerak Berdampak untuk Pendidikan&quot;</em>, kami terus tumbuh
                untuk menjawab tantangan pendidikan yang seharusnya IMBANG, bukan TIMPANG.
              </p>
              <div className="bg-gsb-orange/5 p-6 rounded-2xl border-l-4 border-gsb-orange">
                <p className="italic text-responsive-maroon font-medium">
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

      <section id="makna" className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-heading font-bold text-responsive-maroon mb-4">Filosofi Nama</h2>
            <div className="h-1 w-20 bg-gsb-orange mx-auto rounded-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {philosophy.map((item, idx) => (
              <FadeIn key={item.term} delay={idx * 0.1} className="bg-background p-8 rounded-3xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="mb-4 bg-muted/50 w-14 h-14 rounded-2xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-heading font-bold text-responsive-maroon mb-3">{item.term}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="visi-misi" className="py-12 md:py-16 bg-gsb-maroon text-white relative overflow-hidden">
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
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:max-w-none">
                {values.map((val, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white/10 backdrop-blur-sm p-4 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-colors ${
                      idx === values.length - 1 ? "col-span-2 sm:col-span-1 sm:col-start-2" : ""
                    }`}
                  >
                    <Heart className="w-5 h-5 text-gsb-pink fill-gsb-pink shrink-0" />
                    <span className="font-medium text-lg">{val}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/home/texture.png')] opacity-10 mix-blend-overlay" />
      </section>

      <section id="budaya" className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-responsive-maroon mb-4">Budaya Komunitas GSB</h2>
            <div className="h-1 w-20 bg-gsb-orange mx-auto rounded-full" />
          </div>

          <motion.div
            layout
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {displayedBudaya.map((item) => (
                <motion.div
                  key={item.title}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    layout: { duration: 0.3, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                    height: { duration: 0.3, ease: "easeInOut" }
                  }}
                  className="bg-background p-6 rounded-2xl border border-border hover:border-gsb-orange/50 transition-colors overflow-hidden"
                >
                  <h3 className="font-bold text-lg text-responsive-maroon mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {budayaItems.length > 4 && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAllBudaya(!showAllBudaya)}
                className="gap-2 border-gsb-orange/50 text-gsb-orange hover:bg-gsb-orange/10"
              >
                {showAllBudaya ? (
                  <>
                    Tutup
                    <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
                  </>
                ) : (
                  <>
                    Lihat Selengkapnya
                    <ChevronDown className="w-4 h-4 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
