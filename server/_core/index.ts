import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  getBioBlockById,
  getBioPageByPublicId,
  getShortLinkByCode,
  incrementBioBlockClicks,
  incrementShortLinkClicks,
} from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Short link redirect
  app.get("/r/:code", async (req, res) => {
    const { code } = req.params;
    try {
      const link = await getShortLinkByCode(code);
      if (!link) {
        res.status(404).send("Link bulunamadı");
        return;
      }
      await incrementShortLinkClicks(code);
      res.redirect(302, link.originalUrl);
    } catch (err) {
      console.error("[ShortLink] Error:", err);
      res.status(500).send("Bir hata oluştu");
    }
  });

  // Bio link click redirect with analytics
  app.get("/go/:blockId", async (req, res) => {
    const blockId = Number.parseInt(req.params.blockId, 10);
    if (!Number.isFinite(blockId)) {
      res.status(400).send("Geçersiz link");
      return;
    }

    try {
      const block = await getBioBlockById(blockId);
      if (!block || !block.isEnabled || !["link", "social"].includes(block.type)) {
        res.status(404).send("Link bulunamadı");
        return;
      }

      const page = await getBioPageByPublicId(block.pageId);
      if (!page?.isPublished) {
        res.status(404).send("Sayfa yayında değil");
        return;
      }

      const blockData = block.data as Record<string, string> | null;
      const url = blockData?.url;
      if (!url) {
        res.status(404).send("Link bulunamadı");
        return;
      }

      await incrementBioBlockClicks(block.id);
      res.redirect(302, url);
    } catch (err) {
      console.error("[BioLink] Error:", err);
      res.status(500).send("Bir hata oluştu");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
