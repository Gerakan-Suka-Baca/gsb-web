import { auth } from "@clerk/nextjs/server";
import { getPayloadCached } from "@/lib/payload";

/**
 * Resolve actual PDF download URL from a media document.
 */
function resolvePdfUrl(mediaDoc: Record<string, unknown> | null | undefined): string | null {
  if (!mediaDoc) return null;
  const key = mediaDoc._key as string | undefined;
  if (key) return `https://hivpn20u1z.ufs.sh/f/${key}`;
  const url = mediaDoc.url as string | undefined;
  if (url && url.startsWith("http")) return url;
  return null;
}

/**
 * Server-side proxy to fetch PDF files.
 * Avoids CORS issues — server fetches from Uploadthing CDN and streams to client.
 *
 * GET /api/pdf-proxy?tryoutId=xxx
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tryoutId = searchParams.get("tryoutId");

  if (!tryoutId) {
    return new Response("Missing tryoutId", { status: 400 });
  }

  const payload = await getPayloadCached();
  
  // 1. Auth check - try Clerk first, then Payload Admin
  const { userId: clerkUserId } = await auth();
  const { user: payloadUser } = await payload.auth({ headers: req.headers as unknown as Headers });
  
  const isAdmin = payloadUser && payloadUser.collection === "admins" && ["super-admin", "admin", "volunteer"].includes((payloadUser as any).role || "");

  if (!clerkUserId && !isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }

  // If not admin, require user attempt and verified payment
  if (!isAdmin) {
     const userResult = await payload.find({
       collection: "users",
       where: { clerkUserId: { equals: clerkUserId } },
       limit: 1,
       depth: 0,
     });
     const user = userResult.docs[0];
     if (!user) return new Response("User not found", { status: 403 });

     const [attemptResult, paymentResult] = await Promise.all([
       payload.find({
         collection: "tryout-attempts",
         where: {
           and: [
             { user: { equals: user.id } },
             { tryout: { equals: tryoutId } },
             { status: { equals: "completed" } },
           ],
         },
         limit: 1,
         depth: 0,
       }),
       payload.find({
         collection: "tryout-payments",
         where: {
           and: [
             { user: { equals: user.id } },
             { tryout: { equals: tryoutId } },
             { status: { equals: "verified" } },
           ],
         },
         limit: 1,
         depth: 0,
       }),
     ]);

     if (!attemptResult.docs[0]) return new Response("No completed attempt found", { status: 403 });
     if (!paymentResult.docs[0]) return new Response("Payment not verified", { status: 403 });
  }

  // 3. Get explanation with populated pdf media doc
  const explanationResult = await payload.find({
    collection: "tryout-explanations",
    where: { tryout: { equals: tryoutId } },
    limit: 1,
    depth: 1, // populate the pdf upload field
  });

  const explanationDoc = explanationResult.docs[0] as unknown as Record<string, unknown> | undefined;
  if (!explanationDoc) {
    return new Response("Explanation not found", { status: 404 });
  }

  // Resolve PDF URL from media document
  const pdfMedia = explanationDoc.pdf as Record<string, unknown> | string | undefined;
  let pdfUrl: string | null = null;

  if (typeof pdfMedia === "object" && pdfMedia !== null) {
    pdfUrl = resolvePdfUrl(pdfMedia);
  } else if (typeof pdfMedia === "string") {
    // Not populated, lookup directly
    try {
      const mediaDoc = await payload.findByID({
        collection: "explanation-media",
        id: pdfMedia,
        depth: 0,
      }) as unknown as Record<string, unknown> | null;
      pdfUrl = resolvePdfUrl(mediaDoc);
    } catch {
      pdfUrl = null;
    }
  }

  if (!pdfUrl) {
    return new Response("PDF URL could not be resolved", { status: 404 });
  }

  // 4. Fetch PDF from external URL and stream it back
  try {
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        "Accept": "application/pdf, application/octet-stream, */*",
      },
    });

    if (!pdfResponse.ok) {
      return new Response(`Failed to fetch PDF from source (HTTP ${pdfResponse.status})`, { status: 502 });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    if (pdfBuffer.byteLength === 0) {
      return new Response("PDF file is empty", { status: 502 });
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=3600",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "ETag": `"${tryoutId}-${pdfBuffer.byteLength}"`,
      },
    });
  } catch (error) {
    console.error("PDF proxy fetch error:", error);
    return new Response("Failed to fetch PDF", { status: 502 });
  }
}
