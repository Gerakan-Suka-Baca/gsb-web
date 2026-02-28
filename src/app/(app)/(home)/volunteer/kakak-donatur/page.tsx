"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, FileText, GraduationCap, ArrowRight } from "lucide-react";

export default function KakakDonaturPage() {
  const tiers = [
    {
      level: "Jenjang SD",
      amount: "Rp300.000",
      period: "Per Semester",
      color: "text-gsb-yellow",
      borderColor: "border-gsb-yellow/30",
    },
    {
      level: "Jenjang SMP",
      amount: "Rp450.000",
      period: "Per Semester",
      color: "text-gsb-orange",
      borderColor: "border-gsb-orange/30",
    },
    {
      level: "Jenjang SMA",
      amount: "Rp600.000",
      period: "Per Semester",
      color: "text-gsb-maroon",
      borderColor: "border-gsb-maroon/30",
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Paket buku",
      desc: "di akhir semester",
      color: "text-gsb-red",
      bg: "bg-gsb-red/10",
    },
    {
      icon: FileText,
      title: "Laporan",
      desc: "distribusi donasi",
      color: "text-gsb-orange",
      bg: "bg-gsb-orange/10",
    },
    {
      icon: GraduationCap,
      title: "Rapor siswa",
      desc: "penerima beasiswa",
      color: "text-gsb-maroon",
      bg: "bg-gsb-maroon/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gsb-yellow/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gsb-red/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gsb-yellow/10 text-gsb-orange text-sm font-bold mb-6">
              <Heart className="w-4 h-4" />
              <span>Program Beasiswa Minggu Cerdas</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-responsive-maroon">
              Kakak <span className="text-responsive-orange relative">Donatur
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-gsb-yellow -z-10 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
              Jadilah bagian dari perjalanan pendidikan mereka. Dukung siswa GSB terpilih untuk terus berprestasi.
            </p>

            <Button
              size="lg"
              className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-bold rounded-full px-8 h-14 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              asChild
            >
              <Link href="#daftar">
                Mulai Berdonasi
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn direction="right">
              <div className="relative">
                <div className="absolute -inset-4 bg-gsb-orange/10 rounded-3xl transform -rotate-2" />
                <div className="relative bg-background border border-border p-8 md:p-10 rounded-2xl shadow-sm">
                  <h3 className="text-2xl font-heading font-bold mb-4 text-responsive-maroon">Apa itu Kakak Donatur?</h3>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Kakak donatur adalah orang yang berpartisipasi dalam <span className="font-bold text-responsive-orange">Beasiswa Minggu Cerdas</span>. Sebuah program bantuan biaya hidup dan pendidikan secara parsial atau sebagian untuk siswa GSB terpilih dari jenjang SD, SMP, SMA selama satu semester.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="left">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-responsive-maroon">
                  Apresiasi Prestasi,<br /><span className="text-responsive-orange">Dukung Pendidikan</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Program ini merupakan upaya GSB untuk mengapresiasi para siswa dari segi akademik maupun non-akademik dengan seleksi terlebih dahulu.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Menjadi kakak donatur, itu artinya kamu turut serta berkontribusi untuk membantu biaya hidup dan pendidikan anak di setiap semesternya. Kamu bisa memilih jenjang dan metode pembayaran sesuai kemampuan.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Nominal Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <FadeIn className="text-center mb-12">
            <span className="text-gsb-tosca font-bold tracking-wider uppercase text-sm">Pilihan Donasi</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-responsive-maroon mt-2 mb-4">Nominal Beasiswa</h2>
            <p className="text-muted-foreground text-lg">Pilih jenjang pendidikan yang ingin kamu dukung</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier, idx) => (
              <FadeIn key={tier.level} delay={idx * 0.1} className={`relative bg-background rounded-3xl overflow-hidden border ${tier.borderColor} shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group`}>
                <div className={`p-6 text-center ${tier.color} bg-opacity-10`}>
                  <h3 className="text-2xl font-bold font-heading">{tier.level}</h3>
                </div>
                <div className="p-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground font-medium">Siswa mendapatkan</p>
                  <div className="text-3xl md:text-4xl font-bold text-responsive-maroon">
                    {tier.amount}
                  </div>
                  <p className="text-sm font-bold text-gsb-orange bg-gsb-orange/10 py-1 px-3 rounded-full inline-block">
                    {tier.period}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-responsive-maroon mb-6">Benefit Kakak Donatur</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {benefits.map((item) => (
                <div key={item.title} className="flex flex-col items-center bg-background p-8 rounded-3xl border border-border hover:border-gsb-orange/50 transition-colors">
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-6`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-responsive-maroon mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section id="daftar" className="py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <FadeIn>
            <div className="bg-gsb-maroon rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gsb-yellow/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gsb-orange/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                  Mari Bergerak Untuk Berdampak
                </h2>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Beasiswa ini akan dibuka pendaftarannya setiap semester. Jadilah alasan mereka tersenyum hari ini.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-gsb-maroon hover:bg-gsb-yellow hover:text-gsb-maroon font-bold rounded-full px-10 h-14 text-lg shadow-xl transition-all"
                    asChild
                  >
                    <Link href="https://wa.me/6285156423290?text=Halo%20GSB%2C%20saya%20tertarik%20menjadi%20Kakak%20Donatur" target="_blank">
                      Daftar Sekarang
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
