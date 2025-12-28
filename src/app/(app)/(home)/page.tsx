import { HeroSection } from '@/modules/home/ui/components/HeroSection';
import { AboutSection } from '@/modules/home/ui/components/AboutSection';
import { ProgramSection } from '@/modules/home/ui/components/ProgramSection';
import { ImpactSection } from '@/modules/home/ui/components/ImpactSection';
import { ActivitySlider } from '@/modules/home/ui/components/ActivitySlider';
import { CTASection } from '@/modules/home/ui/components/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProgramSection />
      <ActivitySlider />
      <ImpactSection />
      <CTASection />
    </>
  );
}
