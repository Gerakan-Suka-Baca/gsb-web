"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { Compass, Database, Star } from "lucide-react";

export default function CareducationPage() {
  const products = [
    {
      title: "Suba Expedition",
      desc: "Fun Worksheet Adventure. Belajar membaca sambil bertualang untuk anak usia dini.",
      icon: <Compass className="w-8 h-8" />,
      color: "text-gsb-blue",
      bg: "bg-gsb-blue/10",
    },
    {
      title: "Suba Mission",
      desc: "Your Path to Campus. Modul aksesibel dan Try Out SNBT terjangkau.",
      icon: <Star className="w-8 h-8" />,
      color: "text-gsb-orange",
      bg: "bg-gsb-orange/10",
    },
    {
      title: "Suba Skill Lab",
      desc: "Explore. Learn. Grow. Ruang eksplorasi soft skill dan teknologi.",
      icon: <Database className="w-8 h-8" />,
      color: "text-gsb-tosca",
      bg: "bg-gsb-tosca/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <section className="relative py-20 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <FadeIn direction="up">
            <span className="inline-block py-1 px-3 rounded-full bg-gsb-tosca/10 text-gsb-tosca text-sm font-bold mb-4 tracking-wider uppercase">Social Enterprise</span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-gsb-maroon mb-6">
              Careducation <span className="text-gsb-orange">Movement</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Inovasi keberlanjutan untuk menjembatani akses pendidikan melalui produk dan layanan edukatif yang berdampak.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Products */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-6">
            <div className="grid md:grid-cols-3 gap-8">
               {products.map((item, idx) => (
                  <FadeIn key={item.title} delay={idx * 0.1} className="p-8 rounded-3xl bg-card border border-border hover:border-gsb-tosca/50 transition-colors group">
                     <div className={`${item.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <span className={`${item.color}`}>{item.icon}</span>
                     </div>
                     <h3 className="text-2xl font-bold text-gsb-maroon dark:text-gsb-yellow mb-3">{item.title}</h3>
                     <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </FadeIn>
               ))}
            </div>
        </div>
      </section>
    </div>
  );
}
