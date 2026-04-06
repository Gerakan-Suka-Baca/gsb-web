import { getPayloadCached } from "@/lib/payload";
import { MentorPembahasanView } from "@/modules/mentor-dashboard/ui/views/MentorPembahasanView";

export const metadata = {
  title: "Daftar Pembahasan - Mentor Dashboard",
};

export default async function MentorPembahasanPage() {
  const payload = await getPayloadCached();
  
  let tryouts: any = { docs: [] };
  
  try {
    // Fetch tryout list for mentor explanation index.
    tryouts = await payload.find({
      collection: "tryouts",
      limit: 100,
      sort: "-createdAt",
    });
  } catch (err) {
    console.error("Failed to load tryouts. Returning an empty list.", err);
  }

  const tryoutData = tryouts.docs.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description || "Tidak ada deskripsi",
    dateOpen: doc.dateOpen,
    dateClose: doc.dateClose,
    isPermanent: doc.isPermanent,
  }));

  return <MentorPembahasanView tryouts={tryoutData} />;
}
