import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/pdf, application/octet-stream",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!response.ok) {
      console.error(`Error fetching PDF from ${url}: ${response.status} ${response.statusText}`);
      return new NextResponse(`Error fetching PDF: ${response.statusText}`, { status: response.status });
    }

    // Pass the stream directly to the client
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"pembahasan.pdf\"",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("PDF Proxy Error:", error);
    return new NextResponse("Internal Server Error fetching PDF", { status: 500 });
  }
}
