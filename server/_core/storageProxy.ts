import type { Express } from "express";
import crypto from "node:crypto";
import { ENV } from "./env";

const MAX_IMAGE_UPLOAD_BYTES = 7 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

function createStorageKey(contentType: string) {
  const ext = ALLOWED_IMAGE_TYPES.get(contentType) || "bin";
  const id = crypto.randomUUID().replace(/-/g, "");
  return `bio-images/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${id}.${ext}`;
}

export function registerStorageProxy(app: Express) {
  app.post(["/api/storage/presign-put", "/storage/presign-put"], async (req, res) => {
    const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
    const size = Number(req.body?.size || 0);

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      res.status(400).json({ message: "Lütfen geçerli bir görsel dosyası seçin" });
      return;
    }

    if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_UPLOAD_BYTES) {
      res.status(400).json({ message: "Görsel en fazla 7 MB olabilir" });
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(503).json({ message: "Görsel doğrudan tarayıcıda hazırlanacak. Lütfen sayfayı yenileyip tekrar deneyin." });
      return;
    }

    try {
      const key = createStorageKey(contentType);
      const forgeUrl = new URL(
        "v1/storage/presign/put",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge put error: ${forgeResp.status} ${body}`);
        res.status(502).json({ message: "Storage backend error" });
        return;
      }

      const { url: uploadUrl } = (await forgeResp.json()) as { url: string };
      if (!uploadUrl) {
        res.status(502).json({ message: "Empty signed URL from backend" });
        return;
      }

      res.json({ uploadUrl, key, url: `/manus-storage/${key}` });
    } catch (err) {
      console.error("[StorageProxy] presign put failed:", err);
      res.status(502).json({ message: "Storage proxy error" });
    }
  });

  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as unknown as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(503).send("Storage proxy unavailable");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
