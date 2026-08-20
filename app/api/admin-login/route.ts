import { NextResponse } from 'next/server';

const adminPassword = process.env.ADMIN_PANEL_PASSWORD || "247398";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (String(body?.password || "") !== adminPassword) {
      return NextResponse.json({ message: "Admin sifresi hatali" }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }
}
