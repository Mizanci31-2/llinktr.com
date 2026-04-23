import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getBioPagesWithStatsByUserId,
  getBioPageBySlug,
  getBioPageById,
  checkSlugAvailable,
  createBioPage,
  updateBioPage,
  deleteBioPage,
  incrementBioPageViews,
  getBioBlocksByPageId,
  createBioBlock,
  updateBioBlock,
  deleteBioBlock,
  reorderBioBlocks,
  createShortLink,
  getShortLinksByUserId,
  getShortLinkByCode,
  deleteShortLink,
  updateUserProfileById,
} from "./db";

const MAX_PROFILE_IMAGE_DATA_URL_LENGTH = 7_200_000;
const MAX_BIO_PAGES_PER_USER = 5;
const SHORT_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function isIpAddress(hostname: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function normalizeOriginalUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Geçerli bir URL girin");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Sadece http veya https bağlantıları kısaltılabilir");
  }

  const hostname = parsed.hostname.toLowerCase();
  const looksLikeRealHost = hostname === "localhost" || hostname.includes(".") || isIpAddress(hostname);
  if (!looksLikeRealHost) {
    throw new Error("Lütfen gerçek bir alan adı girin. Örn: example.com");
  }

  return parsed.toString();
}

function slugifyShortCode(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14) || "link";
}

function randomSuffix(length = 4) {
  return Array.from({ length }, () => SHORT_CODE_ALPHABET[Math.floor(Math.random() * SHORT_CODE_ALPHABET.length)]).join("");
}

function getReadableCodeBase(url: string) {
  const parsed = new URL(url);
  const hostPart = parsed.hostname.replace(/^www\./, "").split(".")[0] || "link";
  const firstPathPart = parsed.pathname.split("/").filter(Boolean)[0] || "";
  return slugifyShortCode(firstPathPart && firstPathPart.length > hostPart.length ? `${hostPart}-${firstPathPart}` : hostPart);
}

async function getAvailableShortCode(url: string, customCode?: string) {
  if (customCode) {
    const existing = await getShortLinkByCode(customCode);
    if (existing) throw new Error("Bu kısa ad zaten kullanılıyor");
    return customCode;
  }

  const base = getReadableCodeBase(url);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${base}-${randomSuffix(attempt < 4 ? 4 : 5)}`;
    const existing = await getShortLinkByCode(candidate);
    if (!existing) return candidate;
  }

  throw new Error("Kısa link oluşturulamadı. Lütfen tekrar deneyin");
}

function getRequestOrigin(req: { protocol?: string; headers?: Record<string, string | string[] | undefined> }) {
  const headers = req.headers || {};
  const forwardedProto = Array.isArray(headers["x-forwarded-proto"]) ? headers["x-forwarded-proto"][0] : headers["x-forwarded-proto"];
  const forwardedHost = Array.isArray(headers["x-forwarded-host"]) ? headers["x-forwarded-host"][0] : headers["x-forwarded-host"];
  const host = forwardedHost || (Array.isArray(headers.host) ? headers.host[0] : headers.host);
  if (!host) return "";
  return `${forwardedProto || req.protocol || "http"}://${host}`;
}

const shortUrlSchema = z.string().trim().min(3, "URL çok kısa").max(10000, "URL çok uzun").transform((value, ctx) => {
  try {
    return normalizeOriginalUrl(value);
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: error instanceof Error ? error.message : "Geçerli bir URL girin",
    });
    return z.NEVER;
  }
});

const customShortCodeSchema = z.preprocess(
  value => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string()
    .trim()
    .toLowerCase()
    .min(3, "Kısa ad en az 3 karakter olmalı")
    .max(20, "Kısa ad en fazla 20 karakter olabilir")
    .regex(/^[a-z0-9-]+$/, "Kısa adda sadece harf, rakam ve tire kullanın")
    .optional(),
);

const profileImageUrlSchema = z
  .string()
  .max(MAX_PROFILE_IMAGE_DATA_URL_LENGTH, "Profil resmi en fazla 5 MB olabilir")
  .refine((value) => {
    if (value.startsWith("data:image/")) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Geçerli bir profil resmi URL'si veya görsel dosyası girin");

// --- Bio Pages Router ---------------------------------------------------------

const bioPagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getBioPagesWithStatsByUserId(ctx.user.id);
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const page = await getBioPageBySlug(input.slug);
      if (!page || !page.isPublished) return null;
      await incrementBioPageViews(page.id);
      const blocks = await getBioBlocksByPageId(page.id);
      return { page, blocks };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const page = await getBioPageById(input.id, ctx.user.id);
      if (!page) return null;
      const blocks = await getBioBlocksByPageId(page.id);
      return { page, blocks };
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.number().optional() }))
    .query(async ({ input }) => {
      const available = await checkSlugAvailable(input.slug, input.excludeId);
      return { available };
    }),

  create: protectedProcedure
    .input(z.object({
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-_]+$/),
      title: z.string().min(1).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingPages = await getBioPagesWithStatsByUserId(ctx.user.id);
      if (existingPages.length >= MAX_BIO_PAGES_PER_USER) {
        throw new Error(`Bir hesapta en fazla ${MAX_BIO_PAGES_PER_USER} bio sayfası oluşturabilirsiniz`);
      }

      const available = await checkSlugAvailable(input.slug);
      if (!available) throw new Error("Bu slug zaten kullanılıyor");
      await createBioPage({
        userId: ctx.user.id,
        slug: input.slug,
        title: input.title,
        theme: "dark_grid",
        accentColor: "#22D3EE",
        isPublished: true,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-_]+$/).optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(500).nullable().optional(),
      profileImageUrl: profileImageUrlSchema.nullable().optional(),
      theme: z.string().optional(),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir renk seçin").optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.slug) {
        const available = await checkSlugAvailable(data.slug, id);
        if (!available) throw new Error("Bu slug zaten kullanılıyor");
      }
      await updateBioPage(id, ctx.user.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteBioPage(input.id, ctx.user.id);
      return { success: true };
    }),
});

// --- Bio Blocks Router --------------------------------------------------------

const bioBlocksRouter = router({
  list: protectedProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const page = await getBioPageById(input.pageId, ctx.user.id);
      if (!page) throw new Error("Sayfa bulunamadı");
      return getBioBlocksByPageId(input.pageId);
    }),

  add: protectedProcedure
    .input(z.object({
      pageId: z.number(),
      type: z.enum(["heading", "description", "text", "link", "social", "divider", "profile_image"]),
      sortOrder: z.number(),
      data: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
    }))
    .mutation(async ({ ctx, input }) => {
      const page = await getBioPageById(input.pageId, ctx.user.id);
      if (!page) throw new Error("Sayfa bulunamadı");
      // Check 50 item limit
      const blocks = await getBioBlocksByPageId(input.pageId);
      if (blocks.length >= 50) throw new Error("Maksimum 50 öğe sınırına ulaştınız");
      await createBioBlock({
        pageId: input.pageId,
        type: input.type,
        sortOrder: input.sortOrder,
        isEnabled: true,
        data: input.data,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      pageId: z.number(),
      isEnabled: z.boolean().optional(),
      data: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const page = await getBioPageById(input.pageId, ctx.user.id);
      if (!page) throw new Error("Sayfa bulunamadı");
      const { id, pageId, ...updateData } = input;
      await updateBioBlock(id, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), pageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const page = await getBioPageById(input.pageId, ctx.user.id);
      if (!page) throw new Error("Sayfa bulunamadı");
      await deleteBioBlock(input.id);
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.object({
      pageId: z.number(),
      updates: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const page = await getBioPageById(input.pageId, ctx.user.id);
      if (!page) throw new Error("Sayfa bulunamadı");
      await reorderBioBlocks(input.updates);
      return { success: true };
    }),

  bulkSave: protectedProcedure
    .input(z.object({
      pageId: z.number(),
      blocks: z.array(z.object({
        id: z.number().optional(),
        type: z.enum(["heading", "description", "text", "link", "social", "divider", "profile_image"]),
        sortOrder: z.number(),
        isEnabled: z.boolean(),
        data: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const page = await getBioPageById(input.pageId, ctx.user.id);
      if (!page) throw new Error("Sayfa bulunamadı");
      if (input.blocks.length > 50) throw new Error("Maksimum 50 öğe sınırına ulaştınız");

      const existingBlocks = await getBioBlocksByPageId(input.pageId);
      const incomingIds = new Set(input.blocks.map(block => block.id).filter((id): id is number => typeof id === "number"));

      for (const block of existingBlocks) {
        if (!incomingIds.has(block.id)) {
          await deleteBioBlock(block.id);
        }
      }

      for (const block of input.blocks) {
        if (block.id && existingBlocks.some(existing => existing.id === block.id)) {
          await updateBioBlock(block.id, {
            sortOrder: block.sortOrder,
            isEnabled: block.isEnabled,
            data: block.data,
          });
          continue;
        }

        await createBioBlock({
          pageId: input.pageId,
          type: block.type,
          sortOrder: block.sortOrder,
          isEnabled: block.isEnabled,
          data: block.data,
        });
      }

      return getBioBlocksByPageId(input.pageId);
    }),
});

// --- Short Links Router -------------------------------------------------------

const shortLinksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getShortLinksByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      url: shortUrlSchema,
      customCode: customShortCodeSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const code = await getAvailableShortCode(input.url, input.customCode);
      await createShortLink({
        userId: ctx.user.id,
        originalUrl: input.url,
        code,
        clicks: 0,
      });
      const path = `/r/${code}`;
      const origin = getRequestOrigin(ctx.req);
      return { code, originalUrl: input.url, shortUrl: origin ? `${origin}${path}` : path };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteShortLink(input.id, ctx.user.id);
      return { success: true };
    }),

  resolve: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const link = await getShortLinkByCode(input.code);
      if (!link) return null;
      return { originalUrl: link.originalUrl, clicks: link.clicks };
    }),
});

// --- App Router ---------------------------------------------------------------

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(2, "Kullanıcı adı en az 2 karakter olmalı").max(40, "Kullanıcı adı en fazla 40 karakter olabilir"),
      }))
      .mutation(async ({ ctx, input }) => {
        const updatedUser = await updateUserProfileById(ctx.user.id, { name: input.name });
        return updatedUser ?? ctx.user;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  bioPages: bioPagesRouter,
  bioBlocks: bioBlocksRouter,
  shortLinks: shortLinksRouter,
});

export type AppRouter = typeof appRouter;


