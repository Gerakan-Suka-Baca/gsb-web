import { HeroSection } from '@/modules/home/ui/components/HeroSection';
import { AboutSection } from '@/modules/home/ui/components/AboutSection';
import { ProgramSection } from '@/modules/home/ui/components/ProgramSection';
import { ImpactSection } from '@/modules/home/ui/components/ImpactSection';
import { ActivitySlider } from '@/modules/home/ui/components/ActivitySlider';
import { CTASection } from '@/modules/home/ui/components/CTASection';

export default function HomePage() {
  return (
    <>
      {/* Preconnect to critical third-party origins for faster resource loading */}
      <link rel="preconnect" href="https://clerk.komunitasgsb.id" />
      <link rel="dns-prefetch" href="https://clerk.komunitasgsb.id" />
      <link rel="preconnect" href="https://us-assets.i.posthog.com" />
      <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
      <link rel="preconnect" href="https://i.scdn.co" crossOrigin="anonymous" />
      <link
        rel="preload"
        href="/home/top/gambar1.jpg"
        as="image"
        fetchPriority="high"
      />
      <HeroSection />
      <AboutSection />
      <ProgramSection />
      <ActivitySlider />
      <ImpactSection />
      <CTASection />
    </>
  );
}
