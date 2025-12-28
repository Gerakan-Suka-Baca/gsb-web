'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { FadeIn } from '@/components/ui/fade-in';
import Image from 'next/image';

export function HeroSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const images = [
    '/home/top/gambar1.jpg',
    '/home/top/gambar2.jpg',
    '/home/top/gambar3.jpg',
    '/home/top/gambar4.jpg',
    '/home/top/gambar5.jpg',
  ];

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const autoplayInterval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => {
      clearInterval(autoplayInterval);
    };
  }, [api]);

  return (
    <section id="beranda" className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden bg-background">
      <div className="container mx-auto px-4 lg:px-6 py-8 md:py-16 relative z-10">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-8 md:space-y-10 text-center lg:text-left">
            <FadeIn direction="right" delay={0.1} className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-bold leading-tight text-responsive-maroon">
                Pendidikan Itu Harusnya{' '}
                <span className="text-gsb-orange relative inline-block">
                  IMBANG
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-gsb-yellow -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.6" />
                  </svg>
                </span>, <span className="text-responsive-maroon">Bukan</span>{' '}
                <span className="text-gsb-red">TIMPANG</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Bergerak Berdampak bersama GSB untuk mewujudkan akses pendidikan yang setara bagi seluruh anak Indonesia.
              </p>
            </FadeIn>

            <FadeIn direction="up" delay={0.3} className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                asChild
                className="bg-gsb-orange hover:bg-gsb-orange/90 text-white font-semibold rounded-full px-10 h-14 text-lg shadow-lg transition-all duration-300"
              >
                <a href="#program">Lihat Program</a>
              </Button>
            </FadeIn>

            <FadeIn direction="up" delay={0.5} className="flex flex-wrap gap-8 pt-4 border-t border-border/50 justify-center lg:justify-start">
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-heading font-bold text-gsb-orange">213+</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Siswa Terbantu</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-heading font-bold text-gsb-red">460+</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Relawan Aktif</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-heading font-bold text-gsb-maroon">248+</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kelas Terlaksana</p>
              </div>
            </FadeIn>
          </div>

          <FadeIn direction="left" delay={0.2} className="relative w-full">
            <div className="relative rounded-4xl overflow-hidden shadow-2xl border-4 border-gsb-yellow/20">
              <Carousel
                setApi={setApi}
                opts={{
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video lg:aspect-4/3 bg-muted">
                        <Image
                          src={image}
                          alt={`GSB Activity ${index + 1}`}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop';
                          }}
                          fill
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Manual Navigation Arrows */}
              <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                <button
                  onClick={() => api?.scrollPrev()}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all pointer-events-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button
                  onClick={() => api?.scrollNext()}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all pointer-events-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${index === current
                      ? 'w-8 bg-gsb-yellow'
                      : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    onClick={() => api?.scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-10 -right-10 w-64 h-64 bg-gsb-yellow/10 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-10 -left-10 w-64 h-64 bg-gsb-red/10 rounded-full blur-3xl" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
