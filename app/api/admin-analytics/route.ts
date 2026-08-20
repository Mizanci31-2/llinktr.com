import { NextResponse } from 'next/server';

const adminPassword = process.env.ADMIN_PANEL_PASSWORD || "247398";

export async function GET(req: Request) {
  const isAdminRequest = req.headers.get("x-admin-password") === adminPassword;
  if (!isAdminRequest) {
    return NextResponse.json({ message: "Yetkisiz islem" }, { status: 401 });
  }

  return NextResponse.json({
    analytics: {
      liveVisitors: 0,
      todayVisitors: 0,
      todayViews: 0,
      todayClicks: 0,
      totalUsers: 0,
      totalPages: 0,
      totalLinks: 0,
      usersWithPages: 0,
      topViewedPage: null,
      topClickedLink: null,
      recentUsers: [],
      recentPages: [],
      locations: [],
    },
  });
}
