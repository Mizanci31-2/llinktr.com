import { NextResponse } from 'next/server';
import {
  getBioBlockById,
  getBioPageByPublicId,
  incrementBioBlockClicks,
} from "../../../server/db";

function detectMapProvider(rawUrl: string) {
  const value = rawUrl.toLowerCase();
  if (value.includes("maps.apple.com")) return "apple_maps";
  if (value.includes("google.com/maps") || value.includes("maps.google.") || value.includes("maps.app.goo.gl") || value.includes("goo.gl/maps")) return "google_maps";
  return "auto_maps";
}

function buildLocationRedirectUrl(blockData: Record<string, string> | null | undefined) {
  if (!blockData) return "";
  const rawUrl = blockData.url?.trim();
  if (rawUrl) return rawUrl;

  const provider = blockData.provider === "auto_maps" && rawUrl ? detectMapProvider(rawUrl) : blockData.provider || "auto_maps";
  const lat = Number(blockData.lat);
  const lng = Number(blockData.lng);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  const query = hasCoordinates ? `${lat},${lng}` : (blockData.address || blockData.title || "").trim();
  if (!query) return "";

  if (provider === "apple_maps") return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ blockId: string }> | { blockId: string } }
) {
  const resolvedParams = await params;
  const blockId = Number.parseInt(resolvedParams.blockId, 10);

  if (!Number.isFinite(blockId)) {
    return new NextResponse("Gecersiz link", { status: 400 });
  }

  try {
    const block = await getBioBlockById(blockId);
    if (!block || !block.isEnabled || !["link", "social", "location"].includes(block.type)) {
      return new NextResponse("Link bulunamadi", { status: 404 });
    }

    const page = await getBioPageByPublicId(block.pageId);
    if (!page?.isPublished) {
      return new NextResponse("Sayfa yayinda degil", { status: 404 });
    }

    const blockData = block.data as Record<string, string> | null;
    const rawUrl = block.type === "location" ? buildLocationRedirectUrl(blockData) : blockData?.url?.trim();
    if (!rawUrl) {
      return new NextResponse("Link bulunamadi", { status: 404 });
    }
    const platform = blockData?.platform?.toLowerCase?.() || "";
    let redirectUrl = rawUrl;

    if (platform === "gmail" && !redirectUrl.startsWith("mailto:") && redirectUrl.includes("@")) {
      redirectUrl = `mailto:${redirectUrl}`;
    } else if (platform === "phone" && !redirectUrl.startsWith("tel:")) {
      const compact = redirectUrl.replace(/\s+/g, "");
      if (/^\+?[0-9()\-]+$/.test(compact)) {
        redirectUrl = `tel:${compact.replace(/[()\-]/g, "")}`;
      }
    } else if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(redirectUrl) && !redirectUrl.startsWith("/")) {
      redirectUrl = `https://${redirectUrl}`;
    }

    await incrementBioBlockClicks(block.id);
    return NextResponse.redirect(redirectUrl, 302);
  } catch (err) {
    console.error("[BioLink] Error:", err);
    return new NextResponse("Bir hata olustu", { status: 500 });
  }
}
