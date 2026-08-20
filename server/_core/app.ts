import express from "express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import {
  getBioBlockById,
  getBioPageByPublicId,
  getShortLinkByCode,
  incrementBioBlockClicks,
  incrementShortLinkClicks,
} from "../db";

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

export function createApp() {
  const app = express();
  const adminPassword = process.env.ADMIN_PANEL_PASSWORD || "247398";
  const isAdminRequest = (req: express.Request) => req.headers["x-admin-password"] === adminPassword;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.post("/api/admin-login", (req, res) => {
    if (String(req.body?.password || "") !== adminPassword) {
      res.status(401).json({ message: "Admin sifresi hatali" });
      return;
    }
    res.json({ success: true });
  });

  app.get("/api/admin-analytics", (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ message: "Yetkisiz islem" });
      return;
    }
    res.json({
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
  });

  app.get("/api/resolve-map-url", async (req, res) => {
    const rawUrl = String(req.query.url || "").trim();
    let url: URL;

    try {
      url = new URL(rawUrl);
    } catch {
      res.status(400).json({ message: "Gecersiz konum linki" });
      return;
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
      res.status(400).json({ message: "Desteklenmeyen konum linki" });
      return;
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
      });

      res.json({ url: response.url || url.toString() });
    } catch (err) {
      console.error("[MapResolve] Error:", err);
      res.status(502).json({ message: "Konum linki cozumlenemedi" });
    }
  });

  app.get("/r/:code", async (req, res) => {
    const { code } = req.params;
    try {
      const link = await getShortLinkByCode(code);
      if (!link) {
        res.status(404).send("Link bulunamadi");
        return;
      }
      await incrementShortLinkClicks(code);
      res.redirect(302, link.originalUrl);
    } catch (err) {
      console.error("[ShortLink] Error:", err);
      res.status(500).send("Bir hata olustu");
    }
  });

  app.get("/go/:blockId", async (req, res) => {
    const blockId = Number.parseInt(req.params.blockId, 10);
    if (!Number.isFinite(blockId)) {
      res.status(400).send("Gecersiz link");
      return;
    }

    try {
      const block = await getBioBlockById(blockId);
      if (!block || !block.isEnabled || !["link", "social", "location"].includes(block.type)) {
        res.status(404).send("Link bulunamadi");
        return;
      }

      const page = await getBioPageByPublicId(block.pageId);
      if (!page?.isPublished) {
        res.status(404).send("Sayfa yayinda degil");
        return;
      }

      const blockData = block.data as Record<string, string> | null;
      const rawUrl = block.type === "location" ? buildLocationRedirectUrl(blockData) : blockData?.url?.trim();
      if (!rawUrl) {
        res.status(404).send("Link bulunamadi");
        return;
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
      res.redirect(302, redirectUrl);
    } catch (err) {
      console.error("[BioLink] Error:", err);
      res.status(500).send("Bir hata olustu");
    }
  });



  return app;
}
