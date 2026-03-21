import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    // Resolve relative URLs to absolute
    const absoluteUrl = url.startsWith("http")
      ? url
      : new URL(url, req.nextUrl.origin).toString();

    const response = await fetch(absoluteUrl, {
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(`PDF proxy: upstream returned ${response.status} for ${absoluteUrl}`);
      return new NextResponse(`Error fetching PDF: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Read the full body as ArrayBuffer so we can re-serve it with inline headers
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="pembahasan.pdf"',
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("PDF Proxy Error:", error);
    return new NextResponse("Internal Server Error fetching PDF", {
      status: 500,
    });
  }
}
