import { and, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  bioBlocks,
  bioPages,
  shortLinks,
  users,
  type BioBlock,
  type BioPage,
  type InsertUser,
  type ShortLink,
  type User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

type BlockTypeEnum = "heading" | "description" | "text" | "link" | "social" | "divider" | "profile_image";

let _db: ReturnType<typeof drizzle> | null = null;
let warnedAboutMemoryDb = false;

const memory = {
  nextUserId: 1,
  nextPageId: 1,
  nextBlockId: 1,
  nextShortLinkId: 1,
  users: [] as User[],
  pages: [] as BioPage[],
  blocks: [] as BioBlock[],
  shortLinks: [] as ShortLink[],
};

function now() {
  return new Date();
}

function usingMemoryDb() {
  if (!warnedAboutMemoryDb) {
    console.warn("[Database] DATABASE_URL not configured. Using in-memory local demo data.");
    warnedAboutMemoryDb = true;
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();

  if (!db) {
    usingMemoryDb();
    const existing = memory.users.find(item => item.openId === user.openId);
    const signedInAt = user.lastSignedIn ?? now();
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");

    if (existing) {
      existing.name = user.name ?? existing.name;
      existing.email = user.email ?? existing.email;
      existing.loginMethod = user.loginMethod ?? existing.loginMethod;
      existing.role = role;
      existing.lastSignedIn = signedInAt;
      existing.updatedAt = now();
      return;
    }

    memory.users.push({
      id: memory.nextUserId++,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      createdAt: now(),
      updatedAt: now(),
      lastSignedIn: signedInAt,
    });
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;

    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.users.find(user => user.openId === openId);
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfileById(
  id: number,
  data: Partial<Pick<User, "name" | "email" | "loginMethod">>,
) {
  const db = await getDb();
  const updateData = { ...data, updatedAt: now() };

  if (!db) {
    usingMemoryDb();
    const user = memory.users.find(item => item.id === id);
    if (!user) return undefined;
    Object.assign(user, updateData);
    return user;
  }

  await db.update(users).set(updateData).where(eq(users.id, id));
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getBioPagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.filter(page => page.userId === userId);
  }
  return db.select().from(bioPages).where(eq(bioPages.userId, userId));
}

export async function getBioPagesWithStatsByUserId(userId: number) {
  const pages = await getBioPagesByUserId(userId);
  return Promise.all(
    pages.map(async (page) => {
      const blocks = await getBioBlocksByPageId(page.id);
      const totalClicks = blocks.reduce((sum, block) => sum + (block.clicks ?? 0), 0);
      return { ...page, totalClicks };
    }),
  );
}

export async function getBioPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.find(page => page.slug === slug);
  }
  const result = await db.select().from(bioPages).where(eq(bioPages.slug, slug)).limit(1);
  return result[0];
}

export async function getBioPageById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.find(page => page.id === id && page.userId === userId);
  }
  const result = await db.select().from(bioPages).where(and(eq(bioPages.id, id), eq(bioPages.userId, userId))).limit(1);
  return result[0];
}

export async function getBioPageByPublicId(id: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.find(page => page.id === id);
  }
  const result = await db.select().from(bioPages).where(eq(bioPages.id, id)).limit(1);
  return result[0];
}

export async function checkSlugAvailable(slug: string, excludeId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return !memory.pages.some(page => page.slug === slug && page.id !== excludeId);
  }

  let query;
  if (excludeId) {
    query = db.select({ id: bioPages.id }).from(bioPages).where(and(eq(bioPages.slug, slug), ne(bioPages.id, excludeId))).limit(1);
  } else {
    query = db.select({ id: bioPages.id }).from(bioPages).where(eq(bioPages.slug, slug)).limit(1);
  }
  const result = await query;
  return result.length === 0;
}

export async function createBioPage(data: {
  userId: number;
  slug: string;
  title: string;
  theme: string;
  accentColor: string;
  isPublished: boolean;
}) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.pages.push({
      id: memory.nextPageId++,
      userId: data.userId,
      slug: data.slug,
      title: data.title,
      description: null,
      profileImageUrl: null,
      theme: data.theme,
      accentColor: data.accentColor,
      isPublished: data.isPublished,
      views: 0,
      createdAt: now(),
      updatedAt: now(),
    });
    return;
  }

  await db.insert(bioPages).values({
    userId: data.userId,
    slug: data.slug,
    title: data.title,
    theme: data.theme,
    accentColor: data.accentColor,
    isPublished: data.isPublished,
  });
}

export async function updateBioPage(id: number, userId: number, data: Partial<{
  slug: string;
  title: string;
  description: string | null;
  profileImageUrl: string | null;
  theme: string;
  accentColor: string;
  isPublished: boolean;
}>) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const page = memory.pages.find(item => item.id === id && item.userId === userId);
    if (!page) return;
    Object.assign(page, data, { updatedAt: now() });
    return;
  }

  await db.update(bioPages).set(data).where(and(eq(bioPages.id, id), eq(bioPages.userId, userId)));
}

export async function incrementBioPageViews(id: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const page = memory.pages.find(item => item.id === id);
    if (page) page.views += 1;
    return;
  }

  const result = await db.select({ views: bioPages.views }).from(bioPages).where(eq(bioPages.id, id)).limit(1);
  const currentViews = result[0]?.views ?? 0;
  await db.update(bioPages).set({ views: currentViews + 1 }).where(eq(bioPages.id, id));
}

export async function deleteBioPage(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.blocks = memory.blocks.filter(block => block.pageId !== id);
    memory.pages = memory.pages.filter(page => !(page.id === id && page.userId === userId));
    return;
  }

  await db.delete(bioBlocks).where(eq(bioBlocks.pageId, id));
  await db.delete(bioPages).where(and(eq(bioPages.id, id), eq(bioPages.userId, userId)));
}

export async function getBioBlocksByPageId(pageId: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.blocks
      .filter(block => block.pageId === pageId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const blocks = await db.select().from(bioBlocks).where(eq(bioBlocks.pageId, pageId));
  return blocks.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getBioBlockById(id: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.blocks.find(block => block.id === id);
  }

  const result = await db.select().from(bioBlocks).where(eq(bioBlocks.id, id)).limit(1);
  return result[0];
}

export async function createBioBlock(data: {
  pageId: number;
  type: string;
  sortOrder: number;
  isEnabled: boolean;
  data: Record<string, string | boolean | number>;
}) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.blocks.push({
      id: memory.nextBlockId++,
      pageId: data.pageId,
      type: data.type as BlockTypeEnum,
      sortOrder: data.sortOrder,
      isEnabled: data.isEnabled,
      clicks: 0,
      data: data.data,
      createdAt: now(),
      updatedAt: now(),
    });
    return;
  }

  await db.insert(bioBlocks).values({
    pageId: data.pageId,
    type: data.type as BlockTypeEnum,
    sortOrder: data.sortOrder,
    isEnabled: data.isEnabled,
    data: data.data,
  });
}

export async function updateBioBlock(id: number, data: Partial<{
  sortOrder: number;
  isEnabled: boolean;
  data: Record<string, string | boolean | number>;
}>) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const block = memory.blocks.find(item => item.id === id);
    if (!block) return;
    Object.assign(block, data, { updatedAt: now() });
    return;
  }

  await db.update(bioBlocks).set(data).where(eq(bioBlocks.id, id));
}

export async function incrementBioBlockClicks(id: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const block = memory.blocks.find(item => item.id === id);
    if (block) block.clicks += 1;
    return;
  }

  const block = await getBioBlockById(id);
  if (block) {
    await db.update(bioBlocks).set({ clicks: (block.clicks ?? 0) + 1 }).where(eq(bioBlocks.id, id));
  }
}

export async function deleteBioBlock(id: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.blocks = memory.blocks.filter(block => block.id !== id);
    return;
  }

  await db.delete(bioBlocks).where(eq(bioBlocks.id, id));
}

export async function reorderBioBlocks(updates: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    updates.forEach((update) => {
      const block = memory.blocks.find(item => item.id === update.id);
      if (block) block.sortOrder = update.sortOrder;
    });
    return;
  }

  for (const update of updates) {
    await db.update(bioBlocks).set({ sortOrder: update.sortOrder }).where(eq(bioBlocks.id, update.id));
  }
}

export async function createShortLink(data: {
  userId: number | null;
  originalUrl: string;
  code: string;
  clicks: number;
}) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.shortLinks.push({
      id: memory.nextShortLinkId++,
      userId: data.userId,
      originalUrl: data.originalUrl,
      code: data.code,
      clicks: data.clicks,
      createdAt: now(),
    });
    return;
  }

  await db.insert(shortLinks).values({
    userId: data.userId,
    originalUrl: data.originalUrl,
    code: data.code,
    clicks: data.clicks,
  });
}

export async function getShortLinksByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.shortLinks
      .filter(link => link.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const links = await db.select().from(shortLinks).where(eq(shortLinks.userId, userId));
  return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteShortLink(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.shortLinks = memory.shortLinks.filter(link => !(link.id === id && link.userId === userId));
    return;
  }

  await db.delete(shortLinks).where(and(eq(shortLinks.id, id), eq(shortLinks.userId, userId)));
}

export async function getShortLinkByCode(code: string) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.shortLinks.find(link => link.code === code);
  }

  const result = await db.select().from(shortLinks).where(eq(shortLinks.code, code)).limit(1);
  return result[0];
}

export async function incrementShortLinkClicks(code: string) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const link = memory.shortLinks.find(item => item.code === code);
    if (link) link.clicks += 1;
    return;
  }

  const link = await getShortLinkByCode(code);
  if (link) {
    await db.update(shortLinks).set({ clicks: link.clicks + 1 }).where(eq(shortLinks.code, code));
  }
}
