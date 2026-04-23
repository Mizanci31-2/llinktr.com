import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

type LocalAccount = {
  openId: string;
  name: string;
  email: string;
  password: string;
};

const HIDDEN_DEMO_ACCOUNT: LocalAccount = {
  openId: "local-mizanci31",
  name: "Mizanci31",
  email: "mizancii31@gmail.com",
  password: "Mizanci31",
};

const localAccounts = new Map<string, LocalAccount>([
  [HIDDEN_DEMO_ACCOUNT.email.toLowerCase(), HIDDEN_DEMO_ACCOUNT],
]);

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeRedirectPath(value?: string) {
  if (!value || !value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createLocalOpenId(email: string) {
  const safe = email.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "local-user";
  return `local-${safe}-${Math.random().toString(36).slice(2, 8)}`;
}

async function seedLocalDemoContent(openId: string) {
  if (openId !== HIDDEN_DEMO_ACCOUNT.openId) return;

  const user = await db.getUserByOpenId(openId);
  if (!user) return;

  const pages = await db.getBioPagesByUserId(user.id);
  if (pages.length === 0) {
    const slug = await db.checkSlugAvailable("mizanci31") ? "mizanci31" : "mizanci31-2026";
    await db.createBioPage({
      userId: user.id,
      slug,
      title: "Mizanci31",
      theme: "dark_grid",
      accentColor: "#22D3EE",
      isPublished: true,
    });

    const createdPages = await db.getBioPagesByUserId(user.id);
    const page = createdPages[0];

    if (page) {
      await db.createBioBlock({
        pageId: page.id,
        type: "description",
        sortOrder: 0,
        isEnabled: true,
        data: { text: "Yeni sezon urunleri, kampanya linkleri ve sosyal hesaplar burada." },
      });
      await db.createBioBlock({
        pageId: page.id,
        type: "link",
        sortOrder: 1,
        isEnabled: true,
        data: { title: "Trendyol magazam", url: "https://www.trendyol.com", logoPreset: "trendyol", align: "center" },
      });
      await db.createBioBlock({
        pageId: page.id,
        type: "link",
        sortOrder: 2,
        isEnabled: true,
        data: { title: "Shopify dukkanim", url: "https://www.shopify.com", logoPreset: "shopify_store", align: "center" },
      });
      await db.createBioBlock({
        pageId: page.id,
        type: "social",
        sortOrder: 3,
        isEnabled: true,
        data: { platform: "instagram", url: "https://instagram.com/mizanci31" },
      });
      await db.createBioBlock({
        pageId: page.id,
        type: "social",
        sortOrder: 4,
        isEnabled: true,
        data: { platform: "tiktok", url: "https://tiktok.com/@mizanci31" },
      });
    }
  }

  const shortLinks = await db.getShortLinksByUserId(user.id);
  if (shortLinks.length === 0) {
    const fallbackCode = await db.getShortLinkByCode("mizanci31")
      ? await db.getShortLinkByCode("mizanci31-shopify")
        ? `mizanci-${Date.now()}`
        : "mizanci31-shopify"
      : "mizanci31";
    await db.createShortLink({
      userId: user.id,
      originalUrl: "https://www.shopify.com",
      code: fallbackCode,
      clicks: 0,
    });
  }
}

async function signInLocalAccount(req: Request, res: Response, account: LocalAccount, loginMethod: "local" | "google" = "local") {
  const existingUser = await db.getUserByOpenId(account.openId);
  const effectiveName = existingUser?.name?.trim() || account.name;
  const effectiveEmail = existingUser?.email?.trim() || account.email;

  await db.upsertUser({
    openId: account.openId,
    name: effectiveName,
    email: effectiveEmail,
    loginMethod,
    lastSignedIn: new Date(),
  });

  await seedLocalDemoContent(account.openId);

  const sessionToken = await sdk.createSessionToken(account.openId, {
    name: effectiveName,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/dev-login", async (req: Request, res: Response) => {
    if (ENV.oAuthServerUrl && ENV.appId) {
      res.redirect(302, "/giris");
      return;
    }

    const redirect = normalizeRedirectPath(getQueryParam(req, "redirect"));
    await signInLocalAccount(req, res, HIDDEN_DEMO_ACCOUNT);
    res.redirect(302, redirect);
  });

  app.post("/api/dev-login", async (req: Request, res: Response) => {
    if (ENV.oAuthServerUrl && ENV.appId) {
      res.status(400).json({ success: false, message: "Yerel giriş bu ortamda kapalı" });
      return;
    }

    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);
    const account = localAccounts.get(email);

    if (!account || account.password !== password) {
      res.status(401).json({ success: false, message: "E-posta veya şifre hatalı" });
      return;
    }

    await signInLocalAccount(req, res, account);
    res.json({ success: true, redirect });
  });

  app.post("/api/dev-register", async (req: Request, res: Response) => {
    if (ENV.oAuthServerUrl && ENV.appId) {
      res.status(400).json({ success: false, message: "Yerel kayıt bu ortamda kapalı" });
      return;
    }

    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Lütfen tüm alanları doldurun" });
      return;
    }

    if (localAccounts.has(email)) {
      res.status(409).json({ success: false, message: "Bu e-posta ile kayıtlı bir hesap var" });
      return;
    }

    const account: LocalAccount = {
      openId: createLocalOpenId(email),
      name,
      email,
      password,
    };

    localAccounts.set(email, account);
    await signInLocalAccount(req, res, account);
    res.json({ success: true, redirect });
  });

  app.post("/api/dev-social-auth", async (req: Request, res: Response) => {
    if (ENV.oAuthServerUrl && ENV.appId) {
      res.status(400).json({ success: false, message: "Sosyal giriş bu ortamda OAuth üzerinden çalışır" });
      return;
    }

    const provider = typeof req.body?.provider === "string" ? req.body.provider : "google";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);

    if (provider !== "google") {
      res.status(400).json({ success: false, message: "Bu sağlayıcı şu anda desteklenmiyor" });
      return;
    }

    res.status(400).json({
      success: false,
      message: "Google ile giriş yerelde otomatik açılmaz. Canlıda OAuth bağladığınızda aktif olur.",
      redirect,
    });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
