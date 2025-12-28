import * as React from 'react';
import { FadeIn } from '@/components/ui/fade-in';
import { Users, Heart, BookOpen, MapPin } from 'lucide-react';

export function ImpactSection() {
  const stats = [
    {
      icon: Users,
      value: '213',
      label: 'Siswa Terbantu',
      color: 'text-gsb-orange',
      bgColor: 'bg-gsb-orange/10',
    },
    {
      icon: Heart,
      value: '460+',
      label: 'Relawan Aktif',
      color: 'text-gsb-red',
      bgColor: 'bg-gsb-red/10',
    },
    {
      icon: BookOpen,
      value: '248',
      label: 'Kelas Terlaksana',
      color: 'text-gsb-blue',
      bgColor: 'bg-gsb-blue/10',
    },
    {
      icon: MapPin,
      value: '15+',
      label: 'Lokasi Jangkauan',
      color: 'text-gsb-tosca',
      bgColor: 'bg-gsb-tosca/10',
    },
  ];

  return (
    <section className="pt-20 md:pt-32 pb-10 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gsb-yellow/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gsb-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-responsive-maroon">
            Dampak <span className="text-gsb-orange">GSB</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Angka-angka yang menunjukkan komitmen kami dalam mewujudkan pendidikan setara untuk Indonesia
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10">
          {stats.map((stat, index) => (
            <FadeIn key={index} delay={index * 0.1} direction="up">
              <div className="flex flex-col items-center text-center group">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${stat.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-8 h-8 md:w-10 md:h-10 ${stat.color}`} />
                </div>
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
