import { ExplanationViewer } from "@/modules/tryouts/ui/components/ExplanationViewer";

export default async function MentorPembahasanViewerPage(props: { params: Promise<{ tryoutId: string }> }) {
  const params = await props.params;
  return (
    <div className="w-full h-screen">
      <ExplanationViewer tryoutId={params.tryoutId} backUrl="/mentor-dashboard/pembahasan" />
    </div>
  );
}
