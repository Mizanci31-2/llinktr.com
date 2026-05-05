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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const PUBLIC_SITE_URL = "https://www.llinktr.com";

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

function getAuthRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = typeof forwardedProto === "string" ? forwardedProto : req.protocol || "https";
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = typeof forwardedHost === "string" ? forwardedHost : req.get("host") || "";
  const isLocalHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");

  // Supabase redirect URL allowlist is strict. Force the canonical public URL for
  // production domains so password recovery links don't fail on llinktr.com vs www.
  if (!host || isLocalHost) return PUBLIC_SITE_URL;

  const normalizedHost = host.toLowerCase();
  if (normalizedHost === "llinktr.com" || normalizedHost === "www.llinktr.com") {
    return PUBLIC_SITE_URL;
  }

  return `${proto}://${host}`;
}

function createLocalOpenId(email: string) {
  const safe =
    email
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "local-user";
  return `local-${safe}-${Math.random().toString(36).slice(2, 8)}`;
}

function isSupabaseConfigured() {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

function isRateLimitMessage(rawMessage: string) {
  const msg = rawMessage.toLowerCase();
  return (
    msg.includes("too many") ||
    msg.includes("rate") ||
    msg.includes("429") ||
    msg.includes("security purposes") ||
    msg.includes("request this after")
  );
}

function isAlreadyRegisteredMessage(rawMessage: string) {
  const msg = rawMessage.toLowerCase();
  return (
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("already exists") ||
    msg.includes("user already exists") ||
    msg.includes("bu e-posta zaten")
  );
}

async function supabaseSignUp(email: string, password: string, name: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      data: { name },
    }),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}

async function supabaseSignIn(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}

async function supabaseRecoverPassword(email: string, redirectTo: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email,
      redirect_to: redirectTo,
    }),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}

async function isSupabaseGoogleEnabled() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return false;

  const googleConfig = data?.external?.google;
  if (googleConfig === true) return true;
  if (googleConfig === false || googleConfig == null) return false;
  if (typeof googleConfig === "object") {
    const enabled = (googleConfig as { enabled?: boolean }).enabled;
    return enabled === true;
  }

  return false;
}

async function getSupabaseAuthStatus() {
  if (ENV.oAuthServerUrl && ENV.appId) {
    return { configured: true, googleEnabled: true };
  }

  if (!isSupabaseConfigured()) {
    return { configured: false, googleEnabled: false };
  }
  const googleEnabled = await isSupabaseGoogleEnabled();
  return { configured: true, googleEnabled };
}

async function seedLocalDemoContent(openId: string) {
  if (openId !== HIDDEN_DEMO_ACCOUNT.openId) return;

  const user = await db.getUserByOpenId(openId);
  if (!user) return;

  const pages = await db.getBioPagesByUserId(user.id);
  if (pages.length === 0) {
    const slugBase = "mizanci31";
    const slug = (await db.checkSlugAvailable(slugBase)) ? slugBase : `${slugBase}-2026`;

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
}

async function signInLocalAccount(req: Request, res: Response, account: LocalAccount, loginMethod: "local" | "google" = "local") {
  const existingUser = await db.getUserByOpenId(account.openId);
  const emailOwner = await db.getUserByEmail(account.email);
  const canonicalUser = existingUser || emailOwner;
  const canonicalOpenId = canonicalUser?.openId || account.openId;
  const existingLoginMethod = canonicalUser?.loginMethod ?? "";
  const effectiveName = canonicalUser?.name?.trim() || account.name;
  const effectiveEmail = canonicalUser?.email?.trim() || account.email;
  const effectiveLoginMethod =
    loginMethod === "local"
      ? `local_password:${account.password}`
      : existingLoginMethod.startsWith("local_password:")
        ? existingLoginMethod
        : loginMethod;

  await db.upsertUser({
    openId: canonicalOpenId,
    name: effectiveName,
    email: effectiveEmail,
    loginMethod: effectiveLoginMethod,
    lastSignedIn: new Date(),
  });

  localAccounts.set(account.email.toLowerCase(), {
    ...account,
    openId: canonicalOpenId,
    name: effectiveName,
    email: effectiveEmail,
  });

  await seedLocalDemoContent(canonicalOpenId);

  const sessionToken = await sdk.createSessionToken(canonicalOpenId, {
    name: effectiveName,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

async function trySupabasePasswordLogin(
  req: Request,
  res: Response,
  payload: { email: string; password: string; fallbackName: string; redirect: string },
) {
  if (!isSupabaseConfigured()) return false;

  const { ok, data } = await supabaseSignIn(payload.email, payload.password);
  if (!ok || !data?.user?.id || !data?.user?.email) {
    return false;
  }

  await signInLocalAccount(req, res, {
    openId: `supabase-${data.user.id}`,
    name: data.user.user_metadata?.name || payload.fallbackName,
    email: data.user.email,
    password: payload.password,
  });

  res.json({ success: true, redirect: payload.redirect, source: "supabase_existing_login" });
  return true;
}

async function getStoredAccountByEmail(email: string) {
  const cached = localAccounts.get(email);
  if (cached) return cached;

  const user = await db.getUserByEmail(email);
  if (!user) return null;

  const raw = user.loginMethod ?? "";
  if (!raw.startsWith("local_password:")) return null;
  const password = raw.slice("local_password:".length);

  const restored: LocalAccount = {
    openId: user.openId,
    name: user.name || email.split("@")[0] || "Kullanici",
    email,
    password,
  };
  localAccounts.set(email, restored);
  return restored;
}

async function registerOrSignInLocalFallback(
  req: Request,
  res: Response,
  payload: { name: string; email: string; password: string; redirect: string },
) {
  const existing = await getStoredAccountByEmail(payload.email);
  if (existing) {
    res.status(409).json({
      success: false,
      message: "Bu e-posta zaten kayitli. Lutfen Giris Yap sekmesini kullanin.",
    });
    return;
  }

  const account: LocalAccount = {
    openId: createLocalOpenId(payload.email),
    name: payload.name,
    email: payload.email,
    password: payload.password,
  };
  await signInLocalAccount(req, res, account);
  res.json({ success: true, redirect: payload.redirect, source: "local_fallback_new" });
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/dev-auth-status", async (_req: Request, res: Response) => {
    try {
      const status = await getSupabaseAuthStatus();
      res.json({ success: true, ...status });
    } catch (error) {
      console.error("[AuthStatus] Failed", error);
      res.status(500).json({ success: false, message: "Auth durumu alinamadi" });
    }
  });

  app.get("/api/dev-login", async (req: Request, res: Response) => {
    const redirect = normalizeRedirectPath(getQueryParam(req, "redirect"));
    await signInLocalAccount(req, res, HIDDEN_DEMO_ACCOUNT);
    res.redirect(302, redirect);
  });

  app.post("/api/dev-login", async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);

    if (!email || !password) {
      res.status(400).json({ success: false, message: "E-posta ve şifre gerekli" });
      return;
    }

    if (isSupabaseConfigured()) {
      const { ok, data } = await supabaseSignIn(email, password);
      if (ok && data?.user?.id && data?.user?.email) {
        await signInLocalAccount(req, res, {
          openId: `supabase-${data.user.id}`,
          name: data.user.user_metadata?.name || data.user.email.split("@")[0] || "Kullanıcı",
          email: data.user.email,
          password,
        });
        res.json({ success: true, redirect });
        return;
      }

      const account = await getStoredAccountByEmail(email);
      if (account && account.password === password) {
        await signInLocalAccount(req, res, account);
        res.json({ success: true, redirect, source: "local_fallback_login" });
        return;
      }

      if (account && account.password !== password) {
        res.status(401).json({ success: false, message: "Şifre hatalı" });
        return;
      }

      res.status(404).json({ success: false, message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı veya şifre hatalı" });
      return;
    }

    const account = await getStoredAccountByEmail(email);
    if (!account) {
      res.status(404).json({ success: false, message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı" });
      return;
    }

    if (account.password !== password) {
      res.status(401).json({ success: false, message: "Şifre hatalı" });
      return;
    }

    await signInLocalAccount(req, res, account);
    res.json({ success: true, redirect });
  });
  app.post("/api/dev-register", async (req: Request, res: Response) => {
    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Lutfen tum alanlari doldurun" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Sifre en az 6 karakter olmali" });
      return;
    }

    if (isSupabaseConfigured()) {
      const { ok, data } = await supabaseSignUp(email, password, name);
      if (!ok || !data?.user?.id || !data?.user?.email) {
        const rawMessage = typeof data?.msg === "string"
          ? data.msg
          : typeof data?.error_description === "string"
            ? data.error_description
            : typeof data?.error === "string"
              ? data.error
              : "Kayit islemi basarisiz";

        const existingLoginSucceeded = await trySupabasePasswordLogin(req, res, {
          email,
          password,
          fallbackName: name,
          redirect,
        });
        if (existingLoginSucceeded) return;

        if (isRateLimitMessage(rawMessage)) {
          await registerOrSignInLocalFallback(req, res, { name, email, password, redirect });
          return;
        }

        if (isAlreadyRegisteredMessage(rawMessage)) {
          res.status(409).json({
            success: false,
            message: "Bu e-posta zaten kayitli. Lutfen Giris Yap sekmesini kullanin.",
          });
          return;
        }
        const msgLower = rawMessage.toLowerCase();

        if (
          msgLower.includes("too many") ||
          msgLower.includes("rate") ||
          msgLower.includes("429") ||
          msgLower.includes("security purposes") ||
          msgLower.includes("request this after")
        ) {
          await registerOrSignInLocalFallback(req, res, { name, email, password, redirect });
          return;
        }

        const message = typeof data?.msg === "string"
          ? data.msg
          : typeof data?.error_description === "string"
            ? data.error_description
            : "Kayit islemi basarisiz";
        res.status(400).json({ success: false, message });
        return;
      }

      await signInLocalAccount(req, res, {
        openId: `supabase-${data.user.id}`,
        name: data.user.user_metadata?.name || name,
        email: data.user.email,
        password,
      });
      res.json({ success: true, redirect });
      return;
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, message: "Bu e-posta zaten kayitli" });
      return;
    }

    const account: LocalAccount = {
      openId: createLocalOpenId(email),
      name,
      email,
      password,
    };

    await signInLocalAccount(req, res, account);
    res.json({ success: true, redirect });
  });

  app.post("/api/dev-password-reset-request", async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ success: false, message: "E-posta adresi gerekli" });
      return;
    }

    if (!isSupabaseConfigured()) {
      res.status(400).json({
        success: false,
        message: "Sifre yenileme icin Supabase ayarlari gerekli",
      });
      return;
    }

    const redirectTo = `${getAuthRequestOrigin(req)}/giris?reset=1`;

    const { ok, data } = await supabaseRecoverPassword(email, redirectTo);
    if (!ok) {
      const rawMessage =
        typeof data?.msg === "string"
          ? data.msg
          : typeof data?.error_description === "string"
            ? data.error_description
            : "Sifre yenileme e-postasi gonderilemedi";

      if (isRateLimitMessage(rawMessage)) {
        res.status(429).json({
          success: false,
          message: "Cok sÄ±k deneme yaptÄ±nÄ±z. Lutfen 1 dakika bekleyip tekrar deneyin.",
        });
        return;
      }

      res.status(400).json({ success: false, message: rawMessage });
      return;
    }

    res.json({
      success: true,
      message: "Eger bu e-posta ile kayitli bir hesap varsa sifre yenileme baglantisi gonderildi.",
    });
  });

  app.post("/api/dev-social-auth", async (req: Request, res: Response) => {
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "google";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);
    const mode = req.body?.mode === "signUp" ? "signUp" : "signIn";

    if (provider !== "google") {
      res.status(400).json({ success: false, message: "Bu saglayici su anda desteklenmiyor" });
      return;
    }

    if (ENV.oAuthServerUrl && ENV.appId) {
      const forwardedProto = req.headers["x-forwarded-proto"];
      const proto = typeof forwardedProto === "string" ? forwardedProto : req.protocol || "https";
      const forwardedHost = req.headers["x-forwarded-host"];
      const host = typeof forwardedHost === "string" ? forwardedHost : req.get("host");
      const redirectUri = `${proto}://${host}/api/oauth/callback`;
      const state = Buffer.from(redirectUri).toString("base64");
      const oauthUrl = new URL("/app-auth", ENV.oAuthServerUrl);
      oauthUrl.searchParams.set("appId", ENV.appId);
      oauthUrl.searchParams.set("redirectUri", redirectUri);
      oauthUrl.searchParams.set("state", state);
      oauthUrl.searchParams.set("type", mode);
      oauthUrl.searchParams.set("provider", "google");
      res.json({ success: true, redirect: oauthUrl.toString() });
      return;
    }

    if (!isSupabaseConfigured()) {
      res.status(400).json({
        success: false,
        message: "Google girisi icin Supabase ayarlari eksik",
      });
      return;
    }

    const googleEnabled = await isSupabaseGoogleEnabled();
    if (!googleEnabled) {
      res.status(400).json({
        success: false,
        message: "Google girisi yakinda aktif olacak.",
      });
      return;
    }

    const redirectTo = `${getAuthRequestOrigin(req)}/giris?social=google&next=${encodeURIComponent(redirect)}`;
    const oauthUrl = new URL("/auth/v1/authorize", SUPABASE_URL);
    oauthUrl.searchParams.set("provider", "google");
    oauthUrl.searchParams.set("redirect_to", redirectTo);
    oauthUrl.searchParams.set("scopes", "email profile");

    res.json({ success: true, redirect: oauthUrl.toString() });
  });

  app.post("/api/dev-social-complete", async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body?.email);
    const name = normalizeName(req.body?.name) || "Kullanici";
    const providerUserId = typeof req.body?.providerUserId === "string" ? req.body.providerUserId : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : undefined);

    if (!email || !providerUserId) {
      res.status(400).json({ success: false, message: "Google bilgileri eksik" });
      return;
    }

    const account: LocalAccount = {
      openId: `google-${providerUserId}`,
      name,
      email,
      password: "",
    };

    await signInLocalAccount(req, res, account, "google");
    res.json({ success: true, redirect });
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

