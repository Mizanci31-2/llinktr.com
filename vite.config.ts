import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

/**
 * Ensure `public/sw.js` is available at `/<root>/sw.js` after build.
 *
 * This repo's Vite `publicDir` is `client/public`, so root-level `public/sw.js`
 * would otherwise be skipped and `/sw.js` would fall through to SPA rewrites.
 */
function vitePluginExposeRootServiceWorker(): Plugin {
  let outDirAbs = "";
  const srcAbs = path.resolve(PROJECT_ROOT, "public", "sw.js");

  return {
    name: "expose-root-sw",

    // Serve /sw.js in dev so local testing matches production.
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/sw.js", (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        if (!fs.existsSync(srcAbs)) return next();

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        // Avoid aggressive caching while iterating locally.
        res.setHeader("Cache-Control", "no-store");
        res.end(fs.readFileSync(srcAbs));
      });
    },

    apply: "build",
    configResolved(config) {
      outDirAbs = config.build.outDir;
    },
    closeBundle() {
      if (!outDirAbs) return;
      if (!fs.existsSync(srcAbs)) return;

      const destAbs = path.resolve(outDirAbs, "sw.js");
      fs.copyFileSync(srcAbs, destAbs);
    },
  };
}

const SEO_PAGE_CONFIGS = [
  {
    path: "login",
    title: "Giriş Yap | Llinktr",
    description: "Llinktr hesabınıza giriş yapın. Bio link sayfalarınızı, kısa linklerinizi ve QR kodlarınızı tek panelden yönetin.",
    canonical: "https://llinktr.com/login",
    breadcrumb: "Giriş Yap",
  },
  {
    path: "kayit",
    title: "Ücretsiz Kayıt Ol | Llinktr",
    description: "Ücretsiz Llinktr hesabı oluşturun, bio link sayfanızı hazırlayın ve tüm sosyal medya bağlantılarınızı tek linkte paylaşın.",
    canonical: "https://llinktr.com/kayit",
    breadcrumb: "Ücretsiz Kayıt Ol",
  },
  {
    path: "hakkimizda",
    title: "Hakkımızda | Llinktr",
    description: "Llinktr; içerik üreticileri, işletmeler ve freelancerlar için modern, hızlı ve ücretsiz bio link sayfası oluşturma platformudur.",
    canonical: "https://llinktr.com/hakkimizda",
    breadcrumb: "Hakkımızda",
  },
  {
    path: "bio-duzenleyici",
    title: "Bio Düzenleyici | Llinktr",
    description: "Llinktr Bio Düzenleyici ile sosyal medya, mağaza, WhatsApp ve iletişim linklerinizi tek mobil uyumlu sayfada düzenleyin.",
    canonical: "https://llinktr.com/bio-duzenleyici",
    breadcrumb: "Bio Düzenleyici",
  },
  {
    path: "link-kisaltici",
    title: "Link Kısaltıcı | Llinktr",
    description: "Llinktr Link Kısaltıcı ile uzun bağlantılarınızı kısa, paylaşılabilir ve takip edilebilir linklere dönüştürün.",
    canonical: "https://llinktr.com/link-kisaltici",
    breadcrumb: "Link Kısaltıcı",
  },
  {
    path: "qr-olusturucu",
    title: "QR Oluşturucu | Llinktr",
    description: "Llinktr QR Oluşturucu ile link, WhatsApp, e-posta ve metinler için hızlı, modern ve paylaşılabilir QR kodlar oluşturun.",
    canonical: "https://llinktr.com/qr-olusturucu",
    breadcrumb: "QR Oluşturucu",
  },
  {
    path: "blog",
    title: "Blog | Llinktr",
    description: "Bio link, sosyal medya link yönetimi, Linktree alternatifleri, QR kod ve ücretsiz link sayfası rehberleri.",
    canonical: "https://llinktr.com/blog",
    breadcrumb: "Blog",
  },
  {
    path: "instagram-bio-linki",
    title: "Instagram Bio Linki Oluşturma Rehberi | Llinktr",
    description: "Instagram bio alanında tüm linklerinizi tek sayfada paylaşmak için ücretsiz ve mobil uyumlu yöntemleri öğrenin.",
    canonical: "https://llinktr.com/instagram-bio-linki",
    breadcrumb: "Instagram Bio Linki",
  },
  {
    path: "linktree-alternatifi",
    title: "Linktree Alternatifi Ücretsiz Bio Link Platformu | Llinktr",
    description: "Linktree alternatifi arayanlar için Türkçe, hızlı, ücretsiz ve SEO dostu bio link sayfası rehberi.",
    canonical: "https://llinktr.com/linktree-alternatifi",
    breadcrumb: "Linktree Alternatifi",
  },
  {
    path: "ucretsiz-link-sayfasi",
    title: "Ücretsiz Link Sayfası Oluşturma | Llinktr",
    description: "Ücretsiz link sayfası oluşturun, sosyal medya ve satış bağlantılarınızı tek yerde toplayın.",
    canonical: "https://llinktr.com/ucretsiz-link-sayfasi",
    breadcrumb: "Ücretsiz Link Sayfası",
  },
  {
    path: "bio-link-olusturucu",
    title: "Bio Link Oluşturucu | Llinktr",
    description: "Bio link oluşturucu ile tüm sosyal medya, mağaza ve iletişim bağlantılarınızı tek mobil sayfada paylaşın.",
    canonical: "https://llinktr.com/bio-link-olusturucu",
    breadcrumb: "Bio Link Oluşturucu",
  },
  {
    path: "topluluk-kurallari",
    title: "Topluluk Kuralları | Llinktr",
    description: "Llinktr kullanıcıları için güvenli bağlantı, spam, yetişkin içerik ve kötüye kullanım kuralları.",
    canonical: "https://llinktr.com/topluluk-kurallari",
    breadcrumb: "Topluluk Kuralları",
  },
  {
    path: "yardim-merkezi",
    title: "Yardım Merkezi | Llinktr",
    description: "Bio link sayfası, kısa link, QR kod, hesap ayarları ve güvenlik bildirimleri için Llinktr yardım merkezi.",
    canonical: "https://llinktr.com/yardim-merkezi",
    breadcrumb: "Yardım Merkezi",
  },
  {
    path: "blog/instagram-bio-linki-nasil-olusturulur",
    title: "Instagram Bio Linki Nasıl Oluşturulur? | Llinktr Blog",
    description: "Instagram profilinizde tek bağlantıyla tüm sosyal medya, mağaza ve iletişim linklerinizi nasıl paylaşabileceğinizi öğrenin.",
    canonical: "https://llinktr.com/blog/instagram-bio-linki-nasil-olusturulur",
    breadcrumb: "Instagram Bio Linki Nasıl Oluşturulur?",
  },
  {
    path: "blog/linktree-alternatifleri",
    title: "Linktree Alternatifleri | Llinktr Blog",
    description: "Linktree alternatifi arayanlar için sade, hızlı ve Türkçe bio link sayfası oluşturma seçenekleri.",
    canonical: "https://llinktr.com/blog/linktree-alternatifleri",
    breadcrumb: "Linktree Alternatifleri",
  },
  {
    path: "blog/icerik-ureticileri-icin-en-iyi-bio-araclari",
    title: "İçerik Üreticileri İçin En İyi Bio Araçları | Llinktr Blog",
    description: "İçerik üreticileri için bio link sayfası, sosyal link yönetimi, QR kod ve tıklama istatistiklerinin avantajları.",
    canonical: "https://llinktr.com/blog/icerik-ureticileri-icin-en-iyi-bio-araclari",
    breadcrumb: "İçerik Üreticileri İçin En İyi Bio Araçları",
  },
  {
    path: "blog/e-ticaret-icin-bio-link-kullanimi",
    title: "E-Ticaret İçin Bio Link Kullanımı | Llinktr Blog",
    description: "E-ticaret satıcıları için kampanya, WhatsApp sipariş, ürün koleksiyonu ve sosyal medya linklerini tek sayfada toplama rehberi.",
    canonical: "https://llinktr.com/blog/e-ticaret-icin-bio-link-kullanimi",
    breadcrumb: "E-Ticaret İçin Bio Link Kullanımı",
  },
  {
    path: "blog/tek-link-ile-tum-sosyal-medya-hesaplarini-paylasma",
    title: "Tek Link ile Tüm Sosyal Medya Hesaplarını Paylaşma | Llinktr Blog",
    description: "Instagram, TikTok, YouTube, X, LinkedIn ve WhatsApp hesaplarınızı tek link altında toplamanın pratik yolu.",
    canonical: "https://llinktr.com/blog/tek-link-ile-tum-sosyal-medya-hesaplarini-paylasma",
    breadcrumb: "Tek Link ile Tüm Sosyal Medya Hesaplarını Paylaşma",
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceOrInsertMeta(html: string, selector: RegExp, replacement: string) {
  if (selector.test(html)) return html.replace(selector, replacement);
  return html.replace("</head>", `    ${replacement}\n  </head>`);
}

function vitePluginGenerateSeoPages(): Plugin {
  let outDirAbs = "";

  return {
    name: "generate-seo-pages",
    apply: "build",
    configResolved(config) {
      outDirAbs = config.build.outDir;
    },
    closeBundle() {
      if (!outDirAbs) return;
      const indexPath = path.resolve(outDirAbs, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const baseHtml = fs.readFileSync(indexPath, "utf-8");

      for (const page of SEO_PAGE_CONFIGS) {
        const title = escapeHtml(page.title);
        const description = escapeHtml(page.description);
        const canonical = escapeHtml(page.canonical);

        let html = baseHtml
          .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
          .replace(/<link rel="canonical" href="[^"]*" \/>/i, `<link rel="canonical" href="${canonical}" />`);

        html = replaceOrInsertMeta(html, /<meta\s+name="description"[\s\S]*?\/>/i, `<meta name="description" content="${description}" />`);
        html = replaceOrInsertMeta(html, /<meta\s+property="og:title"[\s\S]*?\/>/i, `<meta property="og:title" content="${title}" />`);
        html = replaceOrInsertMeta(html, /<meta\s+property="og:description"[\s\S]*?\/>/i, `<meta property="og:description" content="${description}" />`);
        html = replaceOrInsertMeta(html, /<meta\s+property="og:url"[\s\S]*?\/>/i, `<meta property="og:url" content="${canonical}" />`);
        html = replaceOrInsertMeta(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/i, `<meta name="twitter:title" content="${title}" />`);
        html = replaceOrInsertMeta(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/i, `<meta name="twitter:description" content="${description}" />`);

        const breadcrumbJsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ana Sayfa",
              item: "https://llinktr.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: page.breadcrumb,
              item: page.canonical,
            },
          ],
        });
        html = html.replace(
          "</head>",
          `    <script type="application/ld+json" id="llinktr-page-breadcrumb-jsonld">${breadcrumbJsonLd}</script>\n  </head>`,
        );

        const pageDir = path.resolve(outDirAbs, page.path);
        fs.mkdirSync(pageDir, { recursive: true });
        fs.writeFileSync(path.resolve(pageDir, "index.html"), html, "utf-8");
      }
    },
  };
}

const isProduction = process.env.NODE_ENV === "production";
const plugins = [
  react(),
  tailwindcss(),
  ...(!isProduction ? [jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()] : []),
];

export default defineConfig({
  plugins: [...plugins, vitePluginExposeRootServiceWorker(), vitePluginGenerateSeoPages()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
