import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Timer } from "lucide-react";
import { useRouter } from "next/navigation";

interface ExamDialogsProps {
  showTimeUpDialog: boolean;
  setShowTimeUpDialog: (open: boolean) => void;
  showConfirmFinish: boolean;
  setShowConfirmFinish: (open: boolean) => void;
  showExitDialog: boolean;
  setShowExitDialog: (open: boolean) => void;
  isFinishingSubtest: boolean;
  unansweredCount: number;
  totalQuestions: number;
  onConfirmFinish: () => void;
  onTimeUpConfirm: () => void;
}

export const ExamDialogs = ({
  showTimeUpDialog,
  setShowTimeUpDialog,
  showConfirmFinish,
  setShowConfirmFinish,
  showExitDialog,
  setShowExitDialog,
  isFinishingSubtest,
  unansweredCount,
  totalQuestions,
  onConfirmFinish,
  onTimeUpConfirm,
}: ExamDialogsProps) => {
  const router = useRouter();

  return (
    <>
      <AlertDialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Timer className="h-5 w-5" />Waktu Habis!
            </AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredCount >= totalQuestions
                ? "Waktu subtes habis dan kamu belum menjawab soal apapun. Jawaban kosong akan tersimpan. Klik lanjutkan untuk ke subtes berikutnya."
                : "Subtes ini telah berakhir. Klik lanjutkan untuk menyimpan jawaban."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowTimeUpDialog(false);
                onTimeUpConfirm();
              }}
              className="bg-gsb-orange hover:bg-gsb-orange/90"
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />Soal Belum Lengkap
            </AlertDialogTitle>
            <AlertDialogDescription>
              Kamu masih memiliki <span className="font-bold text-amber-600">{Math.max(0, unansweredCount)}</span> soal yang belum dijawab. Yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa Lagi</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onConfirmFinish()}
              className="bg-gsb-orange hover:bg-gsb-orange/90"
              disabled={isFinishingSubtest}
            >
              {isFinishingSubtest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFinishingSubtest ? "Menyimpan..." : "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />Keluar dari Ujian?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Waktu masih berjalan! Progres Anda tersimpan otomatis, namun meninggalkan halaman ini dapat mengganggu sesi ujian.<br /><br />
              <span className="font-semibold text-red-600">Tekan &quot;Lanjutkan Ujian&quot; untuk kembali mengerjakan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => router.push("/tryout")} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            >
              Keluar (Batalkan)
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => setShowExitDialog(false)} 
              className="bg-gsb-orange hover:bg-gsb-orange/90"
            >
              Lanjutkan Ujian
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
