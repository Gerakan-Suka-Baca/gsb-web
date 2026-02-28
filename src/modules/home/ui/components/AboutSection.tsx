'use client';

import {
  BookOpen,
  Users,
  Lightbulb,
  Heart,
  Target,
  TrendingUp,
  MessageCircle,
  Award,
} from 'lucide-react';
import { FadeIn } from '@/components/ui/fade-in';
import Image from 'next/image';

export function AboutSection() {
  const divisions = [
    { icon: Users, name: 'Divisi Edukasi', color: 'text-gsb-blue' },
    { icon: TrendingUp, name: 'NextGen', color: 'text-gsb-tosca' },
    { icon: BookOpen, name: 'Akademik', color: 'text-gsb-maroon' },
    { icon: MessageCircle, name: 'Komunikasi Publik', color: 'text-gsb-orange' },
    { icon: Lightbulb, name: 'LiterAksi', color: 'text-gsb-yellow' },
    { icon: Heart, name: 'Engagement', color: 'text-gsb-red' },
  ];

  return (
    <section id="tentang" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FadeIn direction="right" className="relative order-2 lg:order-1">
            <div className="relative rounded-4xl overflow-hidden shadow-2xl border-4 border-gsb-yellow/30 group">
              <Image
                src="/home/about/kelasbogor.jpg"
                alt="GSB Team"
                className="w-full h-112.5 md:h-137.5 object-cover transition-transform duration-700 group-hover:scale-105"
                width={800}
                height={800}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-28 left-8 right-8 z-10">
                <p className="text-white font-heading font-bold text-3xl mb-3 drop-shadow-md">
                  Sejak 2016
                </p>
                <p className="text-white/95 text-lg leading-relaxed drop-shadow-sm max-w-md">
                  Berkomitmen untuk pendidikan setara bagi seluruh anak Indonesia
                </p>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-8 -right-8 bg-card p-6 rounded-2xl shadow-xl hidden md:block z-20 transform hover:-translate-y-2 transition-all duration-300 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="bg-gsb-red/10 p-3 rounded-xl">
                  <Users className="w-8 h-8 text-gsb-red" />
                </div>
                <div>
                  <p className="text-4xl font-heading font-bold text-gsb-red">6</p>
                  <p className="text-sm font-medium text-muted-foreground">Divisi Aktif</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 bg-card p-6 rounded-2xl shadow-xl hidden md:block z-20 transform hover:-translate-y-2 transition-all duration-300 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="bg-gsb-orange/10 p-3 rounded-xl">
                  <Award className="w-8 h-8 text-gsb-orange" />
                </div>
                <div>
                  <p className="text-4xl font-heading font-bold text-gsb-orange">7+</p>
                  <p className="text-sm font-medium text-muted-foreground">Tahun Mengabdi</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="space-y-8 order-1 lg:order-2">
            <FadeIn direction="left" delay={0.2} className="space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight text-responsive-maroon">
                Tentang{' '}
                <span className="text-gsb-orange relative inline-block">
                  GSB
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-gsb-yellow -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.5" />
                  </svg>
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Gerakan Suka Baca (GSB) adalah organisasi nirlaba yang berdiri sejak 2016
                dengan misi mewujudkan akses pendidikan yang setara untuk semua anak Indonesia.
              </p>
              <div className="space-y-4 border-l-4 border-gsb-yellow pl-6">
                <p className="text-muted-foreground leading-relaxed italic">
                  &quot;Kami percaya bahwa setiap anak berhak mendapatkan pendidikan berkualitas,
                  terlepas dari latar belakang ekonomi mereka.&quot;
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.4} className="pt-6">
              <h3 className="text-xl font-heading font-semibold mb-6 text-responsive-maroon flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gsb-orange/10 text-gsb-orange">
                  <Target className="h-4 w-4" />
                </span>
                6 Divisi Kami
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {divisions.map((division, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-card hover:shadow-lg transition-all group cursor-pointer border border-transparent hover:border-gsb-yellow/30"
                  >
                    <div className={`${division.color} p-3 rounded-xl bg-card shadow-sm group-hover:scale-110 transition-transform`}>
                      <division.icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-center font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      {division.name}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
