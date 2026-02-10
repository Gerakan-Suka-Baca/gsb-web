"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Mic, Headphones, Heart, Play, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PodcastPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-background">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gsb-yellow/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gsb-blue/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gsb-tosca/5 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gsb-orange/10 text-gsb-orange text-sm font-bold mb-6 border border-gsb-orange/20">
              <Mic className="w-4 h-4" />
              <span>Media Pembelajaran Audio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-gsb-maroon">
              MSG <span className="text-gsb-orange">Podcast</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              Dongeng edukatif dalam format audio dari Gerakan Suka Baca. Belajar jadi lebih menyenangkan lewat cerita!
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold rounded-full px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg shadow-xl hover:scale-105 transition-all gap-2"
                asChild
              >
                <Link href="https://open.spotify.com/show/5uoOFClrYGurElVUN0MKZM?si=396d8434bcb24c10" target="_blank" rel="noopener noreferrer">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Dengarkan di Spotify
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gsb-maroon text-gsb-maroon hover:bg-gsb-maroon hover:text-white font-bold rounded-full px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg bg-transparent gap-2"
                asChild
              >
                <Link href="#episode-terbaru">
                  <Play className="w-5 h-5" />
                  Episode Terbaru
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="right">
              <div className="space-y-6">
                <span className="text-gsb-orange font-bold tracking-wider uppercase">Tentang</span>
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-gsb-maroon">
                  Apa itu MSG Podcast?
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">MSG Podcast</strong> adalah media pembelajaran inklusif dalam format audio dari Gerakan Suka Baca dalam bentuk <span className="text-gsb-orange font-semibold">dongeng</span>.
                  </p>
                  <p>
                    Sebuah hasil kerja kolektif bersama para relawan dari berbagai daerah di Indonesia. Kami berharap konten ini bisa menjadi media belajar bagi para peserta didik, pendidik, dan orangtua dari latar belakang apapun.
                  </p>
                  <p className="text-gsb-maroon font-semibold italic">
                    &ldquo;Selamat mendengarkan! Mari sama-sama bergerak, untuk sama-sama berdampak!&rdquo;
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="left">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Mic, title: "Dongeng Edukatif", desc: "Cerita menarik yang penuh nilai pembelajaran", color: "bg-gsb-orange/10 text-gsb-orange border-gsb-orange/20" },
                  { icon: Headphones, title: "Format Audio", desc: "Belajar kapan saja dan di mana saja", color: "bg-gsb-blue/10 text-gsb-blue border-gsb-blue/20" },
                  { icon: Heart, title: "Karya Relawan", desc: "Dibuat dengan cinta oleh relawan se-Indonesia", color: "bg-gsb-tosca/10 text-gsb-tosca border-gsb-tosca/20" },
                  { icon: Sparkles, title: "Gratis & Inklusif", desc: "Untuk semua kalangan tanpa terkecuali", color: "bg-gsb-yellow/10 text-gsb-yellow-dark border-gsb-yellow/20" },
                ].map((item) => (
                  <div key={item.title} className={`p-6 rounded-2xl border-2 ${item.color} hover:scale-105 transition-transform`}>
                    <item.icon className="w-10 h-10 mb-4" />
                    <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Latest Episode Section */}
      <section id="episode-terbaru" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <FadeIn className="text-center mb-12">
            <span className="text-gsb-orange font-bold tracking-wider uppercase">Dengarkan Sekarang</span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gsb-maroon mt-4 mb-6">
              Episode Terbaru
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nikmati episode terbaru langsung dari sini, atau kunjungi Spotify untuk koleksi lengkap!
            </p>
          </FadeIn>

          {/* Spotify Embed Container */}
          <FadeIn className="max-w-4xl mx-auto">
            <div className="bg-background rounded-3xl p-6 md:p-8 shadow-xl border border-border">
              <div className="rounded-xl overflow-hidden">
                <iframe
                  style={{ borderRadius: 12 }}
                  src="https://open.spotify.com/embed/episode/5rPE6ssboJYn8HQ8o9Rktu?utm_source=generator&theme=0"
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <FadeIn>
            <div className="bg-gradient-to-br from-gsb-maroon to-gsb-red rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
              {/* Decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gsb-yellow/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                  Dengarkan Semua Episode
                </h2>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                  Jelajahi koleksi lengkap dongeng edukatif kami di Spotify. Gratis dan bisa didengarkan kapan saja!
                </p>

                <Button
                  size="lg"
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold rounded-full px-10 h-16 text-xl shadow-2xl hover:scale-105 transition-all gap-3"
                  asChild
                >
                  <Link href="https://open.spotify.com/show/5uoOFClrYGurElVUN0MKZM?si=396d8434bcb24c10" target="_blank" rel="noopener noreferrer">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Buka di Spotify
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
