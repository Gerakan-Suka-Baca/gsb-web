import { getPayload } from "payload";
import config from "@payload-config";
import type { Media } from "@/payload-types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const payload = await getPayload({ config });
  const { filename } = await params;
  const target = decodeURIComponent(filename.join("/"));

  const result = await payload.find({
    collection: "media",
    where: { filename: { equals: target } },
    limit: 1,
  });

  const doc = result.docs[0] as Media | undefined;
  const fileKey = doc?._key || "";
  const url = doc?.url || "";

  if (fileKey) {
    return Response.redirect(`https://utfs.io/f/${fileKey}`, 302);
  }

  if (url.startsWith("http")) {
    return Response.redirect(url, 302);
  }

  return new Response("File not found", { status: 404 });
}
