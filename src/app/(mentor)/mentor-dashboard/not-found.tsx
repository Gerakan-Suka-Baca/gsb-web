import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function MentorNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12 text-red-600" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-800 mb-4">
        Berkas Tidak Ditemukan
      </h1>
      
      <p className="text-lg text-slate-600 max-w-md mb-8">
        Halaman atau rute yang Anda tuju pada panel mentor tidak tersedia atau telah dipindahkan.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="h-12 px-6 rounded-xl bg-gsb-orange hover:bg-orange-600 shadow-md">
          <Link href="/mentor-dashboard">
            Kembali ke Beranda Mentor
          </Link>
        </Button>
      </div>
    </div>
  );
}
