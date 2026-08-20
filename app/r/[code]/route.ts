import { NextResponse } from 'next/server';
import { getShortLinkByCode, incrementShortLinkClicks } from "../../../server/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  // In Next.js 15, params is often a Promise. Using a pattern that works for both.
  const resolvedParams = await params;
  const { code } = resolvedParams;

  try {
    const link = await getShortLinkByCode(code);
    if (!link) {
      return new NextResponse("Link bulunamadi", { status: 404 });
    }
    await incrementShortLinkClicks(code);
    return NextResponse.redirect(link.originalUrl, 302);
  } catch (err) {
    console.error("[ShortLink] Error:", err);
    return new NextResponse("Bir hata olustu", { status: 500 });
  }
}
