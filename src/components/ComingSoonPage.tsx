import { FadeIn } from "@/components/ui/fade-in";
import { Clock, Code } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoonPage({ title }: ComingSoonProps) {
  const description = "Halaman ini sedang dalam tahap pengembangan.";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
       <FadeIn className="text-center max-w-xl">
          <div className="w-20 h-20 bg-gsb-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Code className="w-10 h-10 text-gsb-orange" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gsb-maroon mb-4">
            {title}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {description}
          </p>
          
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted/50 rounded-full text-sm font-semibold text-foreground/80 border border-border/50">
             <Clock className="w-4 h-4" />
             <span>Coming Soon</span>
          </div>
       </FadeIn>
    </div>
  );
}
