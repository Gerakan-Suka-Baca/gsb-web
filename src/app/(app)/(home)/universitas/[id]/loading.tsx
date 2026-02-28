import { Loader2 } from "lucide-react";

export default function LoadingUniversity() {
  return (
    <div className="bg-background min-h-[calc(100vh-4rem)] pb-12 w-full flex flex-col items-center justify-center p-8">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-bold text-foreground">Sedang Memuat Data...</h2>
      <p className="text-muted-foreground mt-2 text-center max-w-sm">
        Harap tunggu sebentar, kami sedang mengambil data program studi dan metrik kelulusan kampus pilihanmu.
      </p>
    </div>
  );
}
