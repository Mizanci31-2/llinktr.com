import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { and, eq, inArray } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { bioBlocks, bioPages, links, shortLinks, users } from "../drizzle/schema";
import {
  getProfileByUsername,
  getProfileByUserId,
  createProfile,
  updateProfile,
  getLinksByUserId,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
  recordLinkClick,
  getLinkClickCount,
  getLinkClicksByUserId,
  getDb,
} from "./db";

const BLOCKED_CONTENT_TERMS = ["adult", "porno", "bahis", "casino", "scam", "phishing", "malware", "doland1r1c1l1k"];
const SUSPICIOUS_SHORTENER_HOSTS = new Set(["bit.ly", "tinyurl.com", "ow.ly", "is.gd", "cutt.ly"]);

function sanitizeUserForClient(user: unknown) {
  if (!user || typeof user !== "object") return user;
  const { loginMethod: _loginMethod, ...safeUser } = user as Record<string, unknown>;
  return safeUser;
}

function assertSafeUserContent(values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const blocked = BLOCKED_CONTENT_TERMS.find((term) => text.includes(term));
  if (blocked) {
    throw new Error("Bu i�erik platform g�venlik kurallar1na uygun g�r�nm�yor.");
  }

  for (const value of values) {
    if (!value) continue;
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, "");
      if (SUSPICIOUS_SHORTENER_HOSTS.has(host)) {
        throw new Error("Maskelenmi_ veya _�pheli k1sa linkler g�venlik nedeniyle kabul edilmiyor.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("kabul edilmiyor")) throw error;
    }
  }
}


const blockTypeSchema = z.enum(["heading", "description", "text", "link", "social", "location", "divider", "profile_image"]);
const blockDataSchema = z.record(z.union([z.string(), z.boolean(), z.number()]));

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 100);
}

function makeShortCode(length = 6) {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function withBioPageMetrics<T extends typeof bioPages.$inferSelect>(page: T, blocks: Array<typeof bioBlocks.$inferSelect>) {
  const enabledBlocks = blocks.filter((block) => block.isEnabled !== false);
  return { ...page, blocks: enabledBlocks.length, totalClicks: enabledBlocks.reduce((sum, block) => sum + (block.clicks ?? 0), 0), todayClicks: page.todayClicks ?? 0, todayViews: page.todayViews ?? 0 };
}

async function restoreLegacyLinksAsBioPage(userId: string) {
  const db = await getDb();
  if (!db) return;
  const [existingPage] = await db.select().from(bioPages).where(eq(bioPages.userId, userId)).limit(1);
  if (existingPage) return;
  const legacyLinks = await db.select().from(links).where(eq(links.userId, userId)).orderBy(links.order);
  if (legacyLinks.length === 0) return;
  const profile = await getProfileByUserId(userId);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const sourceName = profile?.username || user?.name || user?.email?.split("@")[0] || "Linklerim";
  const slugBase = normalizeSlug(sourceName.replace(/\s+/g, "-")) || "linklerim";
  let slug = slugBase;
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const taken = await db.select({ id: bioPages.id }).from(bioPages).where(eq(bioPages.slug, slug)).limit(1);
    if (taken.length === 0) break;
    slug = slugBase + "-" + String(attempt + 1);
  }
  const [page] = await db.insert(bioPages).values({ userId, slug, title: sourceName || "Linklerim", description: "Eski linkleriniz otomatik olarak geri yuklendi.", theme: "dark_grid", accentColor: "#DFFF00", textColor: "#F8FAFC", isPublished: true }).returning();
  if (!page) return;
  await db.insert(bioBlocks).values(legacyLinks.map((item, index) => ({ pageId: page.id, type: "link" as const, sortOrder: item.order ?? index, isEnabled: true, data: { title: item.title, url: item.url, align: "center" } })));
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => sanitizeUserForClient(opts.ctx.user)),

    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(2).max(80) }))
      .mutation(async ({ ctx, input }) => {
        assertSafeUserContent([input.name]);
        const db = await getDb();
        if (!db) throw new Error("Veritabani baglantisi hazir degil");
        const [updatedUser] = await db.update(users).set({ name: input.name.trim(), updatedAt: new Date() }).where(eq(users.id, ctx.user.id)).returning();
        return sanitizeUserForClient(updatedUser || { ...ctx.user, name: input.name.trim() });
      }),
    deleteAccount: protectedProcedure
      .input(z.object({ confirmation: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const normalizedConfirmation = input.confirmation.trim().toLocaleLowerCase("tr-TR").replace(/1/g, "i");
        if (normalizedConfirmation !== "onayliyorum") throw new Error("Hesap silme onayi gecersiz");
        const db = await getDb();
        if (!db) throw new Error("Veritabani baglantisi hazir degil");
        await db.delete(users).where(eq(users.id, ctx.user.id));
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Profile operations
  profile: router({
    getByUsername: publicProcedure
      .input(z.object({ username: z.string().min(1) }))
      .query(async ({ input }) => {
        const profile = await getProfileByUsername(input.username);
        return profile;
      }),

    getMe: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      return profile;
    }),

    create: protectedProcedure
      .input(
        z.object({
          username: z.string().min(3).max(50),
          bio: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertSafeUserContent([input.username, input.bio]);
        // Check if username is already taken
        const existing = await getProfileByUsername(input.username);
        if (existing) {
          throw new Error("Bu kullan1c1 ad1 zaten al1nm1_");
        }

        const profile = await createProfile({
          userId: ctx.user.id,
          username: input.username,
          bio: input.bio,
        });

        return profile;
      }),

    update: protectedProcedure
      .input(
        z.object({
          username: z.string().min(3).max(50).optional(),
          bio: z.string().nullable().optional(),
          avatarUrl: z.string().nullable().optional(),
          avatarKey: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertSafeUserContent([input.username, input.bio, input.avatarUrl]);
        // Check if new username is available
        if (input.username) {
          const existing = await getProfileByUsername(input.username);
          if (existing && existing.userId !== ctx.user.id) {
            throw new Error("Bu kullan1c1 ad1 zaten al1nm1_");
          }
        }

        const profile = await updateProfile(ctx.user.id, input);
        return profile;
      }),
  }),

  // Link operations
  links: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const links = await getLinksByUserId(ctx.user.id);
      return links;
    }),

    getPublic: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const profile = await getProfileByUsername(input.username);
        if (!profile) return [];

        const links = await getLinksByUserId(profile.userId);
        return links;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          url: z.string().url(),
          order: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertSafeUserContent([input.title, input.url]);
        const link = await createLink({
          userId: ctx.user.id,
          title: input.title,
          url: input.url,
          order: input.order,
        });

        return link;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          title: z.string().min(1).max(255).optional(),
          url: z.string().url().optional(),
          order: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertSafeUserContent([input.title, input.url]);
        const link = await updateLink(input.id, ctx.user.id, {
          title: input.title,
          url: input.url,
          order: input.order,
        });

        if (!link) {
          throw new Error("Link bulunamad1 veya g�ncellenemedi");
        }

        return link;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteLink(input.id, ctx.user.id);
        if (!success) {
          throw new Error("Link silinemedi");
        }
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({ linkIds: z.array(z.number().int()) }))
      .mutation(async ({ ctx, input }) => {
        await reorderLinks(ctx.user.id, input.linkIds);
        return { success: true };
      }),

    recordClick: publicProcedure
      .input(z.object({ linkId: z.number().int() }))
      .mutation(async ({ input }) => {
        await recordLinkClick(input.linkId);
        return { success: true };
      }),

    getClickCount: protectedProcedure
      .input(z.object({ linkId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const link = await getLinkById(input.linkId);
        if (!link || link.userId !== ctx.user.id) {
          throw new Error("Link bulunamad1");
        }

        const count = await getLinkClickCount(input.linkId);
        return { count };
      }),

    getClickStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getLinkClicksByUserId(ctx.user.id);
      return stats;
    }),
  }),

  bioPages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await restoreLegacyLinksAsBioPage(ctx.user.id);
      const db = await getDb();
      if (!db) return [];
      const pages = await db.select().from(bioPages).where(eq(bioPages.userId, ctx.user.id)).orderBy(bioPages.createdAt);
      if (pages.length === 0) return [];
      const blocks = await db.select().from(bioBlocks).where(inArray(bioBlocks.pageId, pages.map((page) => page.id)));
      return pages.map((page) => withBioPageMetrics(page, blocks.filter((block) => block.pageId === page.id)));
    }),

    checkSlug: publicProcedure.input(z.object({ slug: z.string().min(2).max(100) })).query(async ({ input }) => {
      const slug = normalizeSlug(input.slug);
      if (slug.length < 2) return { available: false };
      const db = await getDb();
      if (!db) return { available: true };
      const result = await db.select({ id: bioPages.id }).from(bioPages).where(eq(bioPages.slug, slug)).limit(1);
      return { available: result.length === 0 };
    }),

    create: protectedProcedure.input(z.object({ slug: z.string().min(2).max(100), title: z.string().min(1).max(200) })).mutation(async ({ ctx, input }) => {
      const slug = normalizeSlug(input.slug);
      assertSafeUserContent([slug, input.title]);
      if (slug.length < 2) throw new Error("Slug en az 2 karakter olmali");
      const db = await getDb();
      if (!db) throw new Error("Veritabani baglantisi hazir degil");
      const existing = await db.select({ id: bioPages.id }).from(bioPages).where(eq(bioPages.slug, slug)).limit(1);
      if (existing.length > 0) throw new Error("Bu slug zaten kullaniliyor");
      const [page] = await db.insert(bioPages).values({ userId: ctx.user.id, slug, title: input.title, theme: "dark_grid", accentColor: "#DFFF00", textColor: "#F8FAFC", isPublished: true }).returning();
      return page;
    }),

    getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [page] = await db.select().from(bioPages).where(and(eq(bioPages.id, input.id), eq(bioPages.userId, ctx.user.id))).limit(1);
      if (!page) return null;
      const blocks = await db.select().from(bioBlocks).where(eq(bioBlocks.pageId, page.id)).orderBy(bioBlocks.sortOrder);
      return { page, blocks };
    }),

    getBySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [page] = await db.select().from(bioPages).where(eq(bioPages.slug, input.slug)).limit(1);
      if (!page) return null;
      if (page.isPublished === false) return { page, blocks: [], isPaused: true };
      await db.update(bioPages).set({ views: (page.views ?? 0) + 1, todayViews: (page.todayViews ?? 0) + 1 }).where(eq(bioPages.id, page.id));
      const blocks = await db.select().from(bioBlocks).where(eq(bioBlocks.pageId, page.id)).orderBy(bioBlocks.sortOrder);
      return { page: { ...page, views: (page.views ?? 0) + 1 }, blocks, isPaused: false };
    }),

    update: protectedProcedure.input(z.object({
      id: z.number().int(), title: z.string().min(1).max(200).optional(), description: z.string().nullable().optional(),
      profileImageUrl: z.string().nullable().optional(), faviconUrl: z.string().nullable().optional(), theme: z.string().max(50).optional(),
      selectedThemeId: z.string().max(50).optional(), accentColor: z.string().max(20).optional(), textColor: z.string().max(20).optional(),
      customBackgroundImageUrl: z.string().nullable().optional(), themeCategory: z.enum(["solid", "pattern", "photo"]).nullable().optional(), isPublished: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      assertSafeUserContent([input.title, input.description, input.profileImageUrl, input.customBackgroundImageUrl]);
      const db = await getDb();
      if (!db) throw new Error("Veritabani baglantisi hazir degil");
      const updateSet: Partial<typeof bioPages.$inferInsert> = { updatedAt: new Date() };
      if (input.title !== undefined) updateSet.title = input.title;
      if (input.description !== undefined) updateSet.description = input.description;
      if (input.profileImageUrl !== undefined) updateSet.profileImageUrl = input.profileImageUrl;
      if (input.theme !== undefined) updateSet.theme = input.theme;
      if (input.selectedThemeId !== undefined) updateSet.selectedThemeId = input.selectedThemeId;
      if (input.accentColor !== undefined) updateSet.accentColor = input.accentColor;
      if (input.textColor !== undefined) updateSet.textColor = input.textColor;
      if (input.customBackgroundImageUrl !== undefined) updateSet.customBackgroundImageUrl = input.customBackgroundImageUrl;
      if (input.themeCategory !== undefined) updateSet.themeCategory = input.themeCategory;
      if (input.isPublished !== undefined) updateSet.isPublished = input.isPublished;
      const [page] = await db.update(bioPages).set(updateSet).where(and(eq(bioPages.id, input.id), eq(bioPages.userId, ctx.user.id))).returning();
      if (!page) throw new Error("Bio sayfasi bulunamadi");
      return page;
    }),

    delete: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Veritabani baglantisi hazir degil");
      await db.delete(bioPages).where(and(eq(bioPages.id, input.id), eq(bioPages.userId, ctx.user.id)));
      return { success: true } as const;
    }),
  }),

  bioBlocks: router({
    bulkSave: protectedProcedure.input(z.object({
      pageId: z.number().int(),
      allowEmpty: z.boolean().optional(),
      blocks: z.array(z.object({ id: z.number().int().nullable().optional(), type: blockTypeSchema, sortOrder: z.number().int().min(0), isEnabled: z.boolean(), data: blockDataSchema })),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Veritabani baglantisi hazir degil");
      const [page] = await db.select().from(bioPages).where(and(eq(bioPages.id, input.pageId), eq(bioPages.userId, ctx.user.id))).limit(1);
      if (!page) throw new Error("Bio sayfasi bulunamadi");
      if (input.blocks.length === 0 && !input.allowEmpty) throw new Error("En az bir blok ekleyin");
      await db.delete(bioBlocks).where(eq(bioBlocks.pageId, input.pageId));
      if (input.blocks.length > 0) {
        await db.insert(bioBlocks).values(input.blocks.map((block, index) => ({ pageId: input.pageId, type: block.type, sortOrder: index, isEnabled: block.isEnabled, data: block.data })));
      }
      return db.select().from(bioBlocks).where(eq(bioBlocks.pageId, input.pageId)).orderBy(bioBlocks.sortOrder);
    }),
  }),

  shortLinks: router({
    create: publicProcedure.input(z.object({ url: z.string().url() })).mutation(async ({ ctx, input }) => {
      assertSafeUserContent([input.url]);
      const db = await getDb();
      if (!db) throw new Error("Veritabani baglantisi hazir degil");
      let code = makeShortCode();
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const existing = await db.select({ id: shortLinks.id }).from(shortLinks).where(eq(shortLinks.code, code)).limit(1);
        if (existing.length === 0) break;
        code = makeShortCode(7);
      }
      const [link] = await db.insert(shortLinks).values({ userId: ctx.user?.id ?? null, originalUrl: input.url, code }).returning();
      const host = typeof ctx.req.get === "function" ? ctx.req.get("host") : "llinktr.com";
      const proto = ctx.req.protocol || "https";
      return { ...link, shortUrl: proto + "://" + host + "/r/" + code };
    }),
  })
});

export type AppRouter = typeof appRouter;
