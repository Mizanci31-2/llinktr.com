import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import {
  getBioBlockById,
  getBioPageByPublicId,
  getShortLinkByCode,
  incrementBioBlockClicks,
  incrementShortLinkClicks,
} from "../db";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

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
      if (!block || !block.isEnabled || !["link", "social"].includes(block.type)) {
        res.status(404).send("Link bulunamadi");
        return;
      }

      const page = await getBioPageByPublicId(block.pageId);
      if (!page?.isPublished) {
        res.status(404).send("Sayfa yayinda degil");
        return;
      }

      const blockData = block.data as Record<string, string> | null;
      const url = blockData?.url;
      if (!url) {
        res.status(404).send("Link bulunamadi");
        return;
      }

      await incrementBioBlockClicks(block.id);
      res.redirect(302, url);
    } catch (err) {
      console.error("[BioLink] Error:", err);
      res.status(500).send("Bir hata olustu");
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
