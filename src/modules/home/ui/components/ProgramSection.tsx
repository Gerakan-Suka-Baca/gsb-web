'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, GraduationCap, Rocket, ArrowRight } from 'lucide-react';

export function ProgramSection() {
  const programs = [
    {
      icon: BookOpen,
      title: 'Minggu Cerdas',
      description: 'Program belajar rutin setiap minggu, baik secara online maupun offline untuk meningkatkan kemampuan akademik siswa.',
      color: 'border-gsb-maroon',
      iconColor: 'bg-gsb-maroon',
      iconTextColor: 'text-white',
      details: ['Offline & Online', 'Setiap Minggu', 'Semua Mata Pelajaran'],
    },
    {
      icon: Library,
      title: 'Lapak Baca',
      description: 'Perpustakaan keliling yang membawa buku-buku berkualitas ke daerah-daerah yang membutuhkan akses literasi.',
      color: 'border-gsb-yellow',
      iconColor: 'bg-gsb-yellow',
      iconTextColor: 'text-gsb-maroon',
      details: ['Perpustakaan Keliling', 'Akses Gratis', 'Ratusan Buku'],
    },
    {
      icon: GraduationCap,
      title: 'Beasiswa',
      description: 'Program pendanaan pendidikan untuk siswa berprestasi dari keluarga kurang mampu agar dapat melanjutkan pendidikan.',
      color: 'border-gsb-blue',
      iconColor: 'bg-gsb-blue',
      iconTextColor: 'text-white',
      details: ['Pendanaan Penuh', 'Siswa Berprestasi', 'Monitoring Berkala'],
    },
    {
      icon: Rocket,
      title: 'Proyek Berdampak',
      description: 'Inisiatif khusus yang melibatkan siswa dalam proyek sosial untuk mengembangkan soft skills dan kepedulian sosial.',
      color: 'border-gsb-tosca',
      iconColor: 'bg-gsb-tosca',
      iconTextColor: 'text-white',
      details: ['Community Project', 'Leadership Skills', 'Social Impact'],
    },
  ];

  return (
    <section id="program" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 text-responsive-maroon">
            Program GSB{' '}
            <span className="text-gsb-orange">
              Saat Ini
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Berbagai program yang dirancang untuk memberikan dampak maksimal
            dalam akses pendidikan Indonesia
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <Card
              key={index}
              className={`border-t-4 ${program.color} group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1`}
            >
              <CardHeader>
                <div className={`${program.iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <program.icon className={`h-6 w-6 ${program.iconTextColor}`} />
                </div>
                <CardTitle className="text-xl font-heading">{program.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {program.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {program.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full group/btn justify-between"
                >
                  <span>Pelajari Lebih Lanjut</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
