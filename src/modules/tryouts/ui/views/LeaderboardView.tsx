import { Suspense } from "react";
import { Leaderboard } from "../components/Leaderboard";
import { Loader2 } from "lucide-react";

export const LeaderboardView = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-responsive-maroon mb-2">
          Leaderboard Tryout
        </h1>
        <p className="text-muted-foreground">
          Pantau peringkat dan skor tertinggi dari setiap batch Tryout Nasional.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gsb-orange" />
          </div>
        }
      >
        <Leaderboard />
      </Suspense>
    </div>
  );
};
