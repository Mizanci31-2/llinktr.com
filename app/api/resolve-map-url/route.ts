import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = String(searchParams.get("url") || "").trim();
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: "Gecersiz konum linki" }, { status: 400 });
  }

  const allowedHosts = new Set([
    "maps.app.goo.gl",
    "goo.gl",
    "www.google.com",
    "google.com",
    "maps.google.com",
    "maps.apple.com",
  ]);

  if (!allowedHosts.has(url.hostname.toLowerCase())) {
    return NextResponse.json({ message: "Desteklenmeyen konum linki" }, { status: 400 });
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    return NextResponse.json({ url: response.url || url.toString() });
  } catch (err) {
    console.error("[MapResolve] Error:", err);
    return NextResponse.json({ message: "Konum linki cozumlenemedi" }, { status: 502 });
  }
}
