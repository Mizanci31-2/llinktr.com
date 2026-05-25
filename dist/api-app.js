// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import postgres from "postgres";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { and, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  longtext,
  timestamp,
  varchar,
  boolean,
  json
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var bioPages = mysqlTable("bio_pages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  profileImageUrl: longtext("profileImageUrl"),
  faviconUrl: longtext("faviconUrl"),
  theme: varchar("theme", { length: 50 }).default("dark_grid").notNull(),
  accentColor: varchar("accentColor", { length: 20 }).default("#DFFF00").notNull(),
  selectedThemeId: varchar("selected_theme_id", { length: 50 }),
  textColor: varchar("text_color", { length: 20 }).default("#F8FAFC"),
  customBackgroundImageUrl: longtext("custom_background_image_url"),
  themeCategory: varchar("theme_category", { length: 24 }),
  isPublished: boolean("isPublished").default(true).notNull(),
  views: int("views").default(0).notNull(),
  todayClicks: int("todayClicks").default(0).notNull(),
  todayViews: int("todayViews").default(0).notNull(),
  statsDate: varchar("statsDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var bioBlocks = mysqlTable("bio_blocks", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  type: mysqlEnum("type", [
    "heading",
    "description",
    "text",
    "link",
    "social",
    "location",
    "divider",
    "profile_image"
  ]).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  clicks: int("clicks").default(0).notNull(),
  // JSON data for block-specific fields
  data: json("data").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var shortLinks = mysqlTable("short_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  originalUrl: text("originalUrl").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  clicks: int("clicks").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "llinktr-local-development-secret",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
var warnedAboutMemoryDb = false;
var memory = {
  nextUserId: 1,
  nextPageId: 1,
  nextBlockId: 1,
  nextShortLinkId: 1,
  nextContactMessageId: 1,
  users: [],
  pages: [],
  blocks: [],
  shortLinks: [],
  contactMessages: []
};
var memorySnapshotPath = process.env.LLINKTR_MEMORY_PATH || path.join(os.tmpdir(), "llinktr-memory-db.json");
var remoteSnapshotClient = null;
var remoteSnapshotHydrated = false;
var lastRemoteSnapshotError = "";
function now() {
  return /* @__PURE__ */ new Date();
}
function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(/* @__PURE__ */ new Date());
}
function getCurrentDailyStats(page) {
  const key = getTodayKey();
  if (page?.statsDate === key) {
    return {
      todayClicks: page.todayClicks ?? 0,
      todayViews: page.todayViews ?? 0,
      statsDate: key
    };
  }
  return { todayClicks: 0, todayViews: 0, statsDate: key };
}
var dailyStatsColumnsReady = false;
async function ensureDailyStatsColumns(db) {
  if (dailyStatsColumnsReady) return;
  const statements = [
    sql`ALTER TABLE bio_pages ADD COLUMN todayClicks int NOT NULL DEFAULT 0`,
    sql`ALTER TABLE bio_pages ADD COLUMN todayViews int NOT NULL DEFAULT 0`,
    sql`ALTER TABLE bio_pages ADD COLUMN statsDate varchar(10)`
  ];
  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate|already exists|ER_DUP_FIELDNAME/i.test(message)) {
        console.warn("[Database] Daily stats migration skipped:", message);
      }
    }
  }
  dailyStatsColumnsReady = true;
}
function applyMemorySnapshot(parsed) {
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return;
    }
  }
  if (!parsed || typeof parsed !== "object") return;
  memory.nextUserId = Number.isFinite(parsed.nextUserId) ? parsed.nextUserId : memory.nextUserId;
  memory.nextPageId = Number.isFinite(parsed.nextPageId) ? parsed.nextPageId : memory.nextPageId;
  memory.nextBlockId = Number.isFinite(parsed.nextBlockId) ? parsed.nextBlockId : memory.nextBlockId;
  memory.nextShortLinkId = Number.isFinite(parsed.nextShortLinkId) ? parsed.nextShortLinkId : memory.nextShortLinkId;
  memory.nextContactMessageId = Number.isFinite(parsed.nextContactMessageId) ? parsed.nextContactMessageId : memory.nextContactMessageId;
  memory.users = Array.isArray(parsed.users) ? parsed.users.map((item) => ({
    ...item,
    createdAt: item?.createdAt ? new Date(item.createdAt) : now(),
    updatedAt: item?.updatedAt ? new Date(item.updatedAt) : now(),
    lastSignedIn: item?.lastSignedIn ? new Date(item.lastSignedIn) : now()
  })) : [];
  memory.pages = Array.isArray(parsed.pages) ? parsed.pages.map((item) => ({
    ...item,
    createdAt: item?.createdAt ? new Date(item.createdAt) : now(),
    updatedAt: item?.updatedAt ? new Date(item.updatedAt) : now()
  })) : [];
  memory.blocks = Array.isArray(parsed.blocks) ? parsed.blocks.map((item) => ({
    ...item,
    createdAt: item?.createdAt ? new Date(item.createdAt) : now(),
    updatedAt: item?.updatedAt ? new Date(item.updatedAt) : now()
  })) : [];
  memory.shortLinks = Array.isArray(parsed.shortLinks) ? parsed.shortLinks.map((item) => ({
    ...item,
    createdAt: item?.createdAt ? new Date(item.createdAt) : now()
  })) : [];
  memory.contactMessages = Array.isArray(parsed.contactMessages) ? parsed.contactMessages.map((item) => ({
    ...item,
    createdAt: item?.createdAt ? new Date(item.createdAt) : now()
  })) : [];
}
function hydrateMemorySnapshot() {
  try {
    if (!fs.existsSync(memorySnapshotPath)) return;
    const raw = fs.readFileSync(memorySnapshotPath, "utf8");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    applyMemorySnapshot(parsed);
  } catch (error) {
    console.warn("[Database] Memory snapshot load failed:", error);
  }
}
async function ensureRemoteSnapshotHydrated() {
  if (remoteSnapshotHydrated) return;
  const rawUrl = process.env.DATABASE_URL ?? "";
  if (!/^postgres(ql)?:\/\//i.test(rawUrl)) return;
  try {
    remoteSnapshotClient = postgres(rawUrl, { prepare: false, max: 1 });
    await remoteSnapshotClient`create table if not exists llinktr_state (id text primary key, data jsonb not null, updated_at timestamptz not null default now())`;
    const rows = await remoteSnapshotClient`select data from llinktr_state where id = 'global' limit 1`;
    const payload = rows?.[0]?.data;
    if (payload && typeof payload === "object") {
      applyMemorySnapshot(payload);
    } else {
      await remoteSnapshotClient`insert into llinktr_state (id, data) values ('global', ${remoteSnapshotClient.json(memory)}) on conflict (id) do nothing`;
    }
    remoteSnapshotHydrated = true;
  } catch (error) {
    remoteSnapshotHydrated = false;
    remoteSnapshotClient = null;
    lastRemoteSnapshotError = error instanceof Error ? error.message : String(error);
    console.warn("[Database] Remote snapshot init failed:", error);
  }
}
function persistMemorySnapshot() {
  try {
    fs.writeFileSync(memorySnapshotPath, JSON.stringify(memory), "utf8");
  } catch (error) {
    console.warn("[Database] Memory snapshot save failed:", error);
  }
  const rawUrl = process.env.DATABASE_URL ?? "";
  if (!/^postgres(ql)?:\/\//i.test(rawUrl)) return;
  void (async () => {
    try {
      await ensureRemoteSnapshotHydrated();
      if (!remoteSnapshotClient) return;
      await remoteSnapshotClient`insert into llinktr_state (id, data, updated_at) values ('global', ${remoteSnapshotClient.json(memory)}, now()) on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at`;
    } catch (error) {
      lastRemoteSnapshotError = error instanceof Error ? error.message : String(error);
      console.warn("[Database] Remote snapshot save failed:", error);
    }
  })();
}
async function persistMemorySnapshotNow() {
  try {
    fs.writeFileSync(memorySnapshotPath, JSON.stringify(memory), "utf8");
  } catch (error) {
    console.warn("[Database] Memory snapshot save failed:", error);
  }
  const rawUrl = process.env.DATABASE_URL ?? "";
  if (!/^postgres(ql)?:\/\//i.test(rawUrl)) return;
  try {
    await ensureRemoteSnapshotHydrated();
    if (!remoteSnapshotClient) return;
    await remoteSnapshotClient`insert into llinktr_state (id, data, updated_at) values ('global', ${remoteSnapshotClient.json(memory)}, now()) on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at`;
  } catch (error) {
    lastRemoteSnapshotError = error instanceof Error ? error.message : String(error);
    console.warn("[Database] Remote snapshot save failed:", error);
  }
}
hydrateMemorySnapshot();
function usingMemoryDb() {
  if (!warnedAboutMemoryDb) {
    console.warn("[Database] DATABASE_URL not configured. Using in-memory local demo data.");
    warnedAboutMemoryDb = true;
  }
}
function sanitizeContactText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}
function isValidContactEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
async function createContactMessage(input) {
  usingMemoryDb();
  await ensureRemoteSnapshotHydrated();
  const message = {
    id: memory.nextContactMessageId++,
    name: sanitizeContactText(input.name, 80),
    email: sanitizeContactText(input.email, 120).toLowerCase(),
    subject: sanitizeContactText(input.subject, 120),
    message: sanitizeContactText(input.message, 2e3),
    createdAt: now()
  };
  memory.contactMessages.unshift(message);
  memory.contactMessages = memory.contactMessages.slice(0, 500);
  await persistMemorySnapshotNow();
  return message;
}
async function getContactMessages() {
  usingMemoryDb();
  await ensureRemoteSnapshotHydrated();
  return [...(memory.contactMessages ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
async function deleteContactMessage(id) {
  usingMemoryDb();
  await ensureRemoteSnapshotHydrated();
  const before = memory.contactMessages.length;
  memory.contactMessages = memory.contactMessages.filter((message) => message.id !== id);
  const deleted = memory.contactMessages.length !== before;
  if (deleted) await persistMemorySnapshotNow();
  return deleted;
}
async function getDb() {
  const rawUrl = process.env.DATABASE_URL ?? "";
  if (/^postgres(ql)?:\/\//i.test(rawUrl)) {
    await ensureRemoteSnapshotHydrated();
    usingMemoryDb();
    return null;
  }
  if (!_db && rawUrl) {
    try {
      _db = drizzle(rawUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const existing = memory.users.find((item) => item.openId === user.openId);
    const signedInAt = user.lastSignedIn ?? now();
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
    if (existing) {
      existing.name = user.name ?? existing.name;
      existing.email = user.email ?? existing.email;
      existing.loginMethod = user.loginMethod ?? existing.loginMethod;
      existing.role = role;
      existing.lastSignedIn = signedInAt;
      existing.updatedAt = now();
      await persistMemorySnapshotNow();
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
      lastSignedIn: signedInAt
    });
    await persistMemorySnapshotNow();
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    textFields.forEach((field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.users.find((user) => user.openId === openId);
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.users.find((user) => (user.email ?? "").trim().toLowerCase() === normalized);
  }
  const result = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserProfileById(id, data) {
  const db = await getDb();
  const updateData = { ...data, updatedAt: now() };
  if (!db) {
    usingMemoryDb();
    const user = memory.users.find((item) => item.id === id);
    if (!user) return void 0;
    Object.assign(user, updateData);
    await persistMemorySnapshotNow();
    return user;
  }
  await db.update(users).set(updateData).where(eq(users.id, id));
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function getBioPagesByUserId(userId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.filter((page) => page.userId === userId);
  }
  await ensureDailyStatsColumns(db);
  return db.select().from(bioPages).where(eq(bioPages.userId, userId));
}
async function getBioPagesWithStatsByUserId(userId) {
  const pages = await getBioPagesByUserId(userId);
  return Promise.all(
    pages.map(async (page) => {
      const blocks = await getBioBlocksByPageId(page.id);
      const totalClicks = blocks.reduce((sum, block) => sum + (block.clicks ?? 0), 0);
      return { ...page, ...getCurrentDailyStats(page), totalClicks };
    })
  );
}
async function getBioPageBySlug(slug) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.find((page) => page.slug === slug);
  }
  await ensureDailyStatsColumns(db);
  const result = await db.select().from(bioPages).where(eq(bioPages.slug, slug)).limit(1);
  return result[0];
}
async function getBioPageById(id, userId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.find((page) => page.id === id && page.userId === userId);
  }
  await ensureDailyStatsColumns(db);
  const result = await db.select().from(bioPages).where(and(eq(bioPages.id, id), eq(bioPages.userId, userId))).limit(1);
  return result[0];
}
async function getBioPageByPublicId(id) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.pages.find((page) => page.id === id);
  }
  await ensureDailyStatsColumns(db);
  const result = await db.select().from(bioPages).where(eq(bioPages.id, id)).limit(1);
  return result[0];
}
async function checkSlugAvailable(slug, excludeId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return !memory.pages.some((page) => page.slug === slug && page.id !== excludeId);
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
async function createBioPage(data) {
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
      faviconUrl: null,
      theme: data.theme,
      accentColor: data.accentColor,
      selectedThemeId: data.selectedThemeId ?? data.theme ?? null,
      textColor: data.textColor ?? "#F8FAFC",
      customBackgroundImageUrl: data.customBackgroundImageUrl ?? null,
      themeCategory: data.themeCategory ?? null,
      isPublished: data.isPublished,
      views: 0,
      createdAt: now(),
      updatedAt: now()
    });
    await persistMemorySnapshotNow();
    return;
  }
  await db.insert(bioPages).values({
    userId: data.userId,
    slug: data.slug,
    title: data.title,
    faviconUrl: data.faviconUrl ?? null,
    theme: data.theme,
    accentColor: data.accentColor,
    selectedThemeId: data.selectedThemeId ?? data.theme ?? null,
    textColor: data.textColor ?? "#F8FAFC",
    customBackgroundImageUrl: data.customBackgroundImageUrl ?? null,
    themeCategory: data.themeCategory ?? null,
    isPublished: data.isPublished
  });
}
async function updateBioPage(id, userId, data) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const page = memory.pages.find((item) => item.id === id && item.userId === userId);
    if (!page) return;
    Object.assign(page, data, { updatedAt: now() });
    await persistMemorySnapshotNow();
    return;
  }
  await db.update(bioPages).set(data).where(and(eq(bioPages.id, id), eq(bioPages.userId, userId)));
}
async function incrementBioPageViews(id) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const page = memory.pages.find((item) => item.id === id);
    if (page) {
      page.views += 1;
      const dailyStats = getCurrentDailyStats(page);
      page.todayViews = dailyStats.todayViews + 1;
      page.todayClicks = dailyStats.todayClicks;
      page.statsDate = dailyStats.statsDate;
      await persistMemorySnapshotNow();
    }
    return;
  }
  await ensureDailyStatsColumns(db);
  const result = await db.select({
    views: bioPages.views,
    todayViews: bioPages.todayViews,
    todayClicks: bioPages.todayClicks,
    statsDate: bioPages.statsDate
  }).from(bioPages).where(eq(bioPages.id, id)).limit(1);
  const dailyStats = getCurrentDailyStats(result[0]);
  const currentViews = result[0]?.views ?? 0;
  await db.update(bioPages).set({
    views: currentViews + 1,
    todayViews: dailyStats.todayViews + 1,
    todayClicks: dailyStats.todayClicks,
    statsDate: dailyStats.statsDate
  }).where(eq(bioPages.id, id));
}
async function deleteBioPage(id, userId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.blocks = memory.blocks.filter((block) => block.pageId !== id);
    memory.pages = memory.pages.filter((page) => !(page.id === id && page.userId === userId));
    await persistMemorySnapshotNow();
    return;
  }
  await db.delete(bioBlocks).where(eq(bioBlocks.pageId, id));
  await db.delete(bioPages).where(and(eq(bioPages.id, id), eq(bioPages.userId, userId)));
}
async function getBioBlocksByPageId(pageId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.blocks.filter((block) => block.pageId === pageId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const blocks = await db.select().from(bioBlocks).where(eq(bioBlocks.pageId, pageId));
  return blocks.sort((a, b) => a.sortOrder - b.sortOrder);
}
async function getBioBlockById(id) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.blocks.find((block) => block.id === id);
  }
  const result = await db.select().from(bioBlocks).where(eq(bioBlocks.id, id)).limit(1);
  return result[0];
}
async function createBioBlock(data) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.blocks.push({
      id: memory.nextBlockId++,
      pageId: data.pageId,
      type: data.type,
      sortOrder: data.sortOrder,
      isEnabled: data.isEnabled,
      clicks: 0,
      data: data.data,
      createdAt: now(),
      updatedAt: now()
    });
    await persistMemorySnapshotNow();
    return;
  }
  await db.insert(bioBlocks).values({
    pageId: data.pageId,
    type: data.type,
    sortOrder: data.sortOrder,
    isEnabled: data.isEnabled,
    data: data.data
  });
}
async function updateBioBlock(id, data) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const block = memory.blocks.find((item) => item.id === id);
    if (!block) return;
    Object.assign(block, data, { updatedAt: now() });
    await persistMemorySnapshotNow();
    return;
  }
  await db.update(bioBlocks).set(data).where(eq(bioBlocks.id, id));
}
async function incrementBioBlockClicks(id) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const block2 = memory.blocks.find((item) => item.id === id);
    if (block2) {
      block2.clicks += 1;
      const page = memory.pages.find((item) => item.id === block2.pageId);
      if (page) {
        const dailyStats = getCurrentDailyStats(page);
        page.todayClicks = dailyStats.todayClicks + 1;
        page.todayViews = dailyStats.todayViews;
        page.statsDate = dailyStats.statsDate;
      }
      await persistMemorySnapshotNow();
    }
    return;
  }
  const block = await getBioBlockById(id);
  if (block) {
    await ensureDailyStatsColumns(db);
    const page = await getBioPageByPublicId(block.pageId);
    const dailyStats = getCurrentDailyStats(page);
    await db.update(bioBlocks).set({ clicks: (block.clicks ?? 0) + 1 }).where(eq(bioBlocks.id, id));
    await db.update(bioPages).set({
      todayClicks: dailyStats.todayClicks + 1,
      todayViews: dailyStats.todayViews,
      statsDate: dailyStats.statsDate
    }).where(eq(bioPages.id, block.pageId));
  }
}
async function deleteBioBlock(id) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.blocks = memory.blocks.filter((block) => block.id !== id);
    await persistMemorySnapshotNow();
    return;
  }
  await db.delete(bioBlocks).where(eq(bioBlocks.id, id));
}
async function reorderBioBlocks(updates) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    updates.forEach((update) => {
      const block = memory.blocks.find((item) => item.id === update.id);
      if (block) block.sortOrder = update.sortOrder;
    });
    await persistMemorySnapshotNow();
    return;
  }
  for (const update of updates) {
    await db.update(bioBlocks).set({ sortOrder: update.sortOrder }).where(eq(bioBlocks.id, update.id));
  }
}
async function createShortLink(data) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.shortLinks.push({
      id: memory.nextShortLinkId++,
      userId: data.userId,
      originalUrl: data.originalUrl,
      code: data.code,
      clicks: data.clicks,
      createdAt: now()
    });
    await persistMemorySnapshotNow();
    return;
  }
  await db.insert(shortLinks).values({
    userId: data.userId,
    originalUrl: data.originalUrl,
    code: data.code,
    clicks: data.clicks
  });
}
async function getShortLinksByUserId(userId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.shortLinks.filter((link) => link.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  const links = await db.select().from(shortLinks).where(eq(shortLinks.userId, userId));
  return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
async function deleteShortLink(id, userId) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    memory.shortLinks = memory.shortLinks.filter((link) => !(link.id === id && link.userId === userId));
    await persistMemorySnapshotNow();
    return;
  }
  await db.delete(shortLinks).where(and(eq(shortLinks.id, id), eq(shortLinks.userId, userId)));
}
async function getShortLinkByCode(code) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    return memory.shortLinks.find((link) => link.code === code);
  }
  const result = await db.select().from(shortLinks).where(eq(shortLinks.code, code)).limit(1);
  return result[0];
}
async function incrementShortLinkClicks(code) {
  const db = await getDb();
  if (!db) {
    usingMemoryDb();
    const link2 = memory.shortLinks.find((item) => item.code === code);
    if (link2) {
      link2.clicks += 1;
      await persistMemorySnapshotNow();
    }
    return;
  }
  const link = await getShortLinkByCode(code);
  if (link) {
    await db.update(shortLinks).set({ clicks: link.clicks + 1 }).where(eq(shortLinks.code, code));
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    const appId = ENV.appId || "local-dev";
    return this.signSession(
      {
        openId,
        appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name: isNonEmptyString(name) ? name : ""
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      if (sessionUserId.startsWith("local-") || sessionUserId.startsWith("supabase-") || sessionUserId.startsWith("google-")) {
        await upsertUser({
          openId: sessionUserId,
          name: session.name || null,
          email: null,
          loginMethod: "session_restore",
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(sessionUserId);
      }
    }
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
var HIDDEN_DEMO_ACCOUNT = {
  openId: "local-mizanci31",
  name: "Mizanci31",
  email: "mizancii31@gmail.com",
  password: "Mizanci31"
};
var localAccounts = /* @__PURE__ */ new Map([
  [HIDDEN_DEMO_ACCOUNT.email.toLowerCase(), HIDDEN_DEMO_ACCOUNT]
]);
var SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
var SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";
var PUBLIC_SITE_URL = "https://www.llinktr.com";
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function normalizeRedirectPath(value) {
  if (!value || !value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}
function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function normalizeName(value) {
  return typeof value === "string" ? value.trim() : "";
}
function getAuthRequestOrigin(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = typeof forwardedProto === "string" ? forwardedProto : req.protocol || "https";
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = typeof forwardedHost === "string" ? forwardedHost : req.get("host") || "";
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
  if (!host || isLocalHost) return PUBLIC_SITE_URL;
  return `${proto}://${host}`;
}
function createLocalOpenId(email) {
  const safe = email.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "local-user";
  return `local-${safe}-${Math.random().toString(36).slice(2, 8)}`;
}
function isSupabaseConfigured() {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
function isRateLimitMessage(rawMessage) {
  const msg = rawMessage.toLowerCase();
  return msg.includes("too many") || msg.includes("rate") || msg.includes("429") || msg.includes("security purposes") || msg.includes("request this after");
}
function isAlreadyRegisteredMessage(rawMessage) {
  const msg = rawMessage.toLowerCase();
  return msg.includes("already registered") || msg.includes("already been registered") || msg.includes("already exists") || msg.includes("user already exists") || msg.includes("bu e-posta zaten");
}
async function supabaseSignUp(email, password, name) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      email,
      password,
      data: { name }
    })
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}
async function supabaseSignIn(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      email,
      password
    })
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}
async function supabaseRecoverPassword(email, redirectTo) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      email,
      redirect_to: redirectTo
    })
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}
async function isSupabaseGoogleEnabled() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return false;
  const googleConfig = data?.external?.google;
  if (googleConfig === true) return true;
  if (googleConfig === false || googleConfig == null) return false;
  if (typeof googleConfig === "object") {
    const enabled = googleConfig?.enabled;
    return enabled === true;
  }
  return false;
}
async function getSupabaseAuthStatus() {
  if (!isSupabaseConfigured()) {
    return { configured: false, googleEnabled: false };
  }
  const googleEnabled = await isSupabaseGoogleEnabled();
  return { configured: true, googleEnabled };
}
async function seedLocalDemoContent(openId) {
  if (openId !== HIDDEN_DEMO_ACCOUNT.openId) return;
  const user = await getUserByOpenId(openId);
  if (!user) return;
  const pages = await getBioPagesByUserId(user.id);
  if (pages.length === 0) {
    const slugBase = "mizanci31";
    const slug = await checkSlugAvailable(slugBase) ? slugBase : `${slugBase}-2026`;
    await createBioPage({
      userId: user.id,
      slug,
      title: "Mizanci31",
      theme: "dark_grid",
      accentColor: "#22D3EE",
      isPublished: true
    });
    const createdPages = await getBioPagesByUserId(user.id);
    const page = createdPages[0];
    if (page) {
      await createBioBlock({
        pageId: page.id,
        type: "description",
        sortOrder: 0,
        isEnabled: true,
        data: { text: "Yeni sezon urunleri, kampanya linkleri ve sosyal hesaplar burada." }
      });
      await createBioBlock({
        pageId: page.id,
        type: "link",
        sortOrder: 1,
        isEnabled: true,
        data: { title: "Trendyol magazam", url: "https://www.trendyol.com", logoPreset: "trendyol", align: "center" }
      });
      await createBioBlock({
        pageId: page.id,
        type: "link",
        sortOrder: 2,
        isEnabled: true,
        data: { title: "Shopify dukkanim", url: "https://www.shopify.com", logoPreset: "shopify_store", align: "center" }
      });
      await createBioBlock({
        pageId: page.id,
        type: "social",
        sortOrder: 3,
        isEnabled: true,
        data: { platform: "instagram", url: "https://instagram.com/mizanci31" }
      });
      await createBioBlock({
        pageId: page.id,
        type: "social",
        sortOrder: 4,
        isEnabled: true,
        data: { platform: "tiktok", url: "https://tiktok.com/@mizanci31" }
      });
    }
  }
}
async function signInLocalAccount(req, res, account, loginMethod = "local") {
  const existingUser = await getUserByOpenId(account.openId);
  const emailOwner = await getUserByEmail(account.email);
  const canonicalUser = existingUser || emailOwner;
  const canonicalOpenId = canonicalUser?.openId || account.openId;
  const existingLoginMethod = canonicalUser?.loginMethod ?? "";
  const effectiveName = canonicalUser?.name?.trim() || account.name;
  const effectiveEmail = canonicalUser?.email?.trim() || account.email;
  const effectiveLoginMethod = loginMethod === "local" ? `local_password:${account.password}` : existingLoginMethod.startsWith("local_password:") ? existingLoginMethod : loginMethod;
  await upsertUser({
    openId: canonicalOpenId,
    name: effectiveName,
    email: effectiveEmail,
    loginMethod: effectiveLoginMethod,
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  localAccounts.set(account.email.toLowerCase(), {
    ...account,
    openId: canonicalOpenId,
    name: effectiveName,
    email: effectiveEmail
  });
  await seedLocalDemoContent(canonicalOpenId);
  const sessionToken = await sdk.createSessionToken(canonicalOpenId, {
    name: effectiveName,
    expiresInMs: ONE_YEAR_MS
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}
async function trySupabasePasswordLogin(req, res, payload) {
  if (!isSupabaseConfigured()) return false;
  const { ok, data } = await supabaseSignIn(payload.email, payload.password);
  if (!ok || !data?.user?.id || !data?.user?.email) {
    return false;
  }
  await signInLocalAccount(req, res, {
    openId: `supabase-${data.user.id}`,
    name: data.user.user_metadata?.name || payload.fallbackName,
    email: data.user.email,
    password: payload.password
  });
  res.json({ success: true, redirect: payload.redirect, source: "supabase_existing_login" });
  return true;
}
async function getStoredAccountByEmail(email) {
  const cached = localAccounts.get(email);
  if (cached) return cached;
  const user = await getUserByEmail(email);
  if (!user) return null;
  const raw = user.loginMethod ?? "";
  if (!raw.startsWith("local_password:")) return null;
  const password = raw.slice("local_password:".length);
  const restored = {
    openId: user.openId,
    name: user.name || email.split("@")[0] || "Kullanici",
    email,
    password
  };
  localAccounts.set(email, restored);
  return restored;
}
async function registerOrSignInLocalFallback(req, res, payload) {
  const existing = await getStoredAccountByEmail(payload.email);
  if (existing) {
    res.status(409).json({
      success: false,
      message: "Bu e-posta zaten kayitli. Lutfen Giris Yap sekmesini kullanin."
    });
    return;
  }
  const account = {
    openId: createLocalOpenId(payload.email),
    name: payload.name,
    email: payload.email,
    password: payload.password
  };
  await signInLocalAccount(req, res, account);
  res.json({ success: true, redirect: payload.redirect, source: "local_fallback_new" });
}
function registerOAuthRoutes(app) {
  app.get("/api/dev-auth-status", async (_req, res) => {
    try {
      const status = await getSupabaseAuthStatus();
      res.json({ success: true, ...status });
    } catch (error) {
      console.error("[AuthStatus] Failed", error);
      res.status(500).json({ success: false, message: "Auth durumu alinamadi" });
    }
  });
  app.get("/api/dev-login", async (req, res) => {
    const redirect = normalizeRedirectPath(getQueryParam(req, "redirect"));
    await signInLocalAccount(req, res, HIDDEN_DEMO_ACCOUNT);
    res.redirect(302, redirect);
  });
  app.post("/api/dev-login", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : void 0);
    if (!email || !password) {
      res.status(400).json({ success: false, message: "E-posta ve sifre gerekli" });
      return;
    }
    if (isSupabaseConfigured()) {
      const { ok, data } = await supabaseSignIn(email, password);
      if (ok && data?.user?.id && data?.user?.email) {
        await signInLocalAccount(req, res, {
          openId: `supabase-${data.user.id}`,
          name: data.user.user_metadata?.name || data.user.email.split("@")[0] || "Kullanici",
          email: data.user.email,
          password
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

      res.status(401).json({ success: false, message: "E-posta veya sifre hatali" });
      return;
    }
    const account = await getStoredAccountByEmail(email);
    if (!account || account.password !== password) {
      res.status(401).json({ success: false, message: "E-posta veya sifre hatali" });
      return;
    }
    await signInLocalAccount(req, res, account);
    res.json({ success: true, redirect });
  });
  app.post("/api/dev-register", async (req, res) => {
    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : void 0);
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
        const rawMessage = typeof data?.msg === "string" ? data.msg : typeof data?.error_description === "string" ? data.error_description : typeof data?.error === "string" ? data.error : "Kayit islemi basarisiz";
        const existingLoginSucceeded = await trySupabasePasswordLogin(req, res, {
          email,
          password,
          fallbackName: name,
          redirect
        });
        if (existingLoginSucceeded) return;
        if (isRateLimitMessage(rawMessage)) {
          await registerOrSignInLocalFallback(req, res, { name, email, password, redirect });
          return;
        }

        if (isAlreadyRegisteredMessage(rawMessage)) {
          res.status(409).json({
            success: false,
            message: "Bu e-posta zaten kayitli. Lutfen Giris Yap sekmesini kullanin."
          });
          return;
        }

        const message = typeof data?.msg === "string" ? data.msg : typeof data?.error_description === "string" ? data.error_description : "Kayit islemi basarisiz";
        res.status(400).json({ success: false, message });
        return;
      }
      await signInLocalAccount(req, res, {
        openId: `supabase-${data.user.id}`,
        name: data.user.user_metadata?.name || name,
        email: data.user.email,
        password
      });
      res.json({ success: true, redirect });
      return;
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, message: "Bu e-posta zaten kayitli" });
      return;
    }
    const account = {
      openId: createLocalOpenId(email),
      name,
      email,
      password
    };
    await signInLocalAccount(req, res, account);
    res.json({ success: true, redirect });
  });
  app.post("/api/dev-password-reset-request", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ success: false, message: "E-posta adresi gerekli" });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(400).json({
        success: false,
        message: "Sifre yenileme icin Supabase ayarlari gerekli"
      });
      return;
    }
    const redirectTo = `${getAuthRequestOrigin(req)}/giris?reset=1`;
    const { ok, data } = await supabaseRecoverPassword(email, redirectTo);
    if (!ok) {
      const rawMessage = typeof data?.msg === "string" ? data.msg : typeof data?.error_description === "string" ? data.error_description : "Sifre yenileme e-postasi gonderilemedi";
      if (isRateLimitMessage(rawMessage)) {
        res.status(429).json({
          success: false,
          message: "Cok sık deneme yaptınız. Lutfen 1 dakika bekleyip tekrar deneyin."
        });
        return;
      }
      res.status(400).json({ success: false, message: rawMessage });
      return;
    }
    res.json({
      success: true,
      message: "Eger bu e-posta ile kayitli bir hesap varsa sifre yenileme baglantisi gonderildi."
    });
  });
  app.post("/api/dev-social-auth", async (req, res) => {
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "google";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : void 0);
    const mode = req.body?.mode === "signUp" ? "signUp" : "signIn";
    if (provider !== "google") {
      res.status(400).json({ success: false, message: "Bu saglayici su anda desteklenmiyor" });
      return;
    }
    if (ENV.oAuthServerUrl && ENV.appId) {
      const forwardedProto2 = req.headers["x-forwarded-proto"];
      const proto2 = typeof forwardedProto2 === "string" ? forwardedProto2 : req.protocol || "https";
      const forwardedHost2 = req.headers["x-forwarded-host"];
      const host2 = typeof forwardedHost2 === "string" ? forwardedHost2 : req.get("host");
      const redirectUri = `${proto2}://${host2}/api/oauth/callback`;
      const state = Buffer.from(redirectUri).toString("base64");
      const oauthUrl2 = new URL("/app-auth", ENV.oAuthServerUrl);
      oauthUrl2.searchParams.set("appId", ENV.appId);
      oauthUrl2.searchParams.set("redirectUri", redirectUri);
      oauthUrl2.searchParams.set("state", state);
      oauthUrl2.searchParams.set("type", mode);
      oauthUrl2.searchParams.set("provider", "google");
      res.json({ success: true, redirect: oauthUrl2.toString() });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(400).json({
        success: false,
        message: "Google girisi icin Supabase ayarlari eksik"
      });
      return;
    }
    const googleEnabled = await isSupabaseGoogleEnabled();
    if (!googleEnabled) {
      res.status(400).json({
        success: false,
        message: "Google girisi yakinda aktif olacak."
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
  app.post("/api/dev-social-complete", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const name = normalizeName(req.body?.name) || "Kullanici";
    const providerUserId = typeof req.body?.providerUserId === "string" ? req.body.providerUserId : "";
    const redirect = normalizeRedirectPath(typeof req.body?.redirect === "string" ? req.body.redirect : void 0);
    if (!email || !providerUserId) {
      res.status(400).json({ success: false, message: "Google bilgileri eksik" });
      return;
    }
    const account = {
      openId: `google-${providerUserId}`,
      name,
      email,
      password: ""
    };
    await signInLocalAccount(req, res, account, "google");
    res.json({ success: true, redirect });
  });
  app.get("/api/oauth/callback", async (req, res) => {
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
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
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

// server/_core/storageProxy.ts
var MAX_IMAGE_UPLOAD_BYTES = 7 * 1024 * 1024;
var ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"]
]);
function createStorageKey(contentType) {
  const ext = ALLOWED_IMAGE_TYPES.get(contentType) || "bin";
  const id = globalThis.crypto.randomUUID().replace(/-/g, "");
  return `bio-images/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/${Date.now()}-${id}.${ext}`;
}
function registerStorageProxy(app) {
  app.post(["/api/storage/presign-put", "/storage/presign-put"], async (req, res) => {
    const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
    const size = Number(req.body?.size || 0);
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      res.status(400).json({ message: "L\xFCtfen ge\xE7erli bir g\xF6rsel dosyas\u0131 se\xE7in" });
      return;
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_UPLOAD_BYTES) {
      res.status(400).json({ message: "G\xF6rsel en fazla 7 MB olabilir" });
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(503).json({ message: "G\xF6rsel do\u011Frudan taray\u0131c\u0131da haz\u0131rlanacak. L\xFCtfen sayfay\u0131 yenileyip tekrar deneyin." });
      return;
    }
    try {
      const key = createStorageKey(contentType);
      const forgeUrl = new URL(
        "v1/storage/presign/put",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge put error: ${forgeResp.status} ${body}`);
        res.status(502).json({ message: "Storage backend error" });
        return;
      }
      const { url: uploadUrl } = await forgeResp.json();
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
    const key = req.params[0];
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
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
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

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var MAX_PROFILE_IMAGE_DATA_URL_LENGTH = 1e7;
var MAX_BIO_PAGES_PER_USER = 5;
var SHORT_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function isIpAddress(hostname) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}
function normalizeOriginalUrl(value) {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Ge\xE7erli bir URL girin");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Sadece http veya https ba\u011Flant\u0131lar\u0131 k\u0131salt\u0131labilir");
  }
  const hostname = parsed.hostname.toLowerCase();
  const looksLikeRealHost = hostname === "localhost" || hostname.includes(".") || isIpAddress(hostname);
  if (!looksLikeRealHost) {
    throw new Error("L\xFCtfen ger\xE7ek bir alan ad\u0131 girin. \xD6rn: example.com");
  }
  return parsed.toString();
}
function slugifyShortCode(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 14) || "link";
}
function randomSuffix(length = 4) {
  return Array.from({ length }, () => SHORT_CODE_ALPHABET[Math.floor(Math.random() * SHORT_CODE_ALPHABET.length)]).join("");
}
function getReadableCodeBase(url) {
  const parsed = new URL(url);
  const hostPart = parsed.hostname.replace(/^www\./, "").split(".")[0] || "link";
  const firstPathPart = parsed.pathname.split("/").filter(Boolean)[0] || "";
  return slugifyShortCode(firstPathPart && firstPathPart.length > hostPart.length ? `${hostPart}-${firstPathPart}` : hostPart);
}
async function getAvailableShortCode(url, customCode) {
  if (customCode) {
    const existing = await getShortLinkByCode(customCode);
    if (existing) throw new Error("Bu k\u0131sa ad zaten kullan\u0131l\u0131yor");
    return customCode;
  }
  const base = getReadableCodeBase(url);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${base}-${randomSuffix(attempt < 4 ? 4 : 5)}`;
    const existing = await getShortLinkByCode(candidate);
    if (!existing) return candidate;
  }
  throw new Error("K\u0131sa link olu\u015Fturulamad\u0131. L\xFCtfen tekrar deneyin");
}
function getRequestOrigin(req) {
  const headers = req.headers || {};
  const forwardedProto = Array.isArray(headers["x-forwarded-proto"]) ? headers["x-forwarded-proto"][0] : headers["x-forwarded-proto"];
  const forwardedHost = Array.isArray(headers["x-forwarded-host"]) ? headers["x-forwarded-host"][0] : headers["x-forwarded-host"];
  const host = forwardedHost || (Array.isArray(headers.host) ? headers.host[0] : headers.host);
  if (!host) return "";
  return `${forwardedProto || req.protocol || "http"}://${host}`;
}
var shortUrlSchema = z2.string().trim().min(3, "URL \xE7ok k\u0131sa").max(1e4, "URL \xE7ok uzun").transform((value, ctx) => {
  try {
    return normalizeOriginalUrl(value);
  } catch (error) {
    ctx.addIssue({
      code: z2.ZodIssueCode.custom,
      message: error instanceof Error ? error.message : "Ge\xE7erli bir URL girin"
    });
    return z2.NEVER;
  }
});
var customShortCodeSchema = z2.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? void 0 : value,
  z2.string().trim().toLowerCase().min(3, "K\u0131sa ad en az 3 karakter olmal\u0131").max(20, "K\u0131sa ad en fazla 20 karakter olabilir").regex(/^[a-z0-9-]+$/, "K\u0131sa adda sadece harf, rakam ve tire kullan\u0131n").optional()
);
var profileImageUrlSchema = z2.string().max(MAX_PROFILE_IMAGE_DATA_URL_LENGTH, "Profil resmi en fazla 7 MB olabilir").refine((value) => {
  if (value.startsWith("data:image/")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, "Ge\xE7erli bir profil resmi URL'si veya g\xF6rsel dosyas\u0131 girin");
var faviconUrlSchema = z2.string().max(MAX_PROFILE_IMAGE_DATA_URL_LENGTH, "Sekme logosu en fazla 7 MB olabilir").refine((value) => {
  if (value.startsWith("data:image/")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, "Ge\xE7erli bir sekme logosu URL'si veya g\xF6rsel dosyas\u0131 girin");
var bioPagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getBioPagesWithStatsByUserId(ctx.user.id);
  }),
  getBySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ input }) => {
    const page = await getBioPageBySlug(input.slug);
    if (!page) return null;
    const isPaused = !page.isPublished;
    if (!isPaused) {
      void incrementBioPageViews(page.id).catch((error) => console.warn("[BioPage] view increment failed:", error));
    }
    const blocks = await getBioBlocksByPageId(page.id);
    return { page, blocks, isPaused };
  }),
  getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
    const page = await getBioPageById(input.id, ctx.user.id);
    if (!page) return null;
    const blocks = await getBioBlocksByPageId(page.id);
    return { page, blocks };
  }),
  checkSlug: publicProcedure.input(z2.object({ slug: z2.string(), excludeId: z2.number().optional() })).query(async ({ input }) => {
    const available = await checkSlugAvailable(input.slug, input.excludeId);
    return { available };
  }),
  create: protectedProcedure.input(z2.object({
    slug: z2.string().min(2).max(50).regex(/^[a-z0-9-_]+$/),
    title: z2.string().min(1).max(200)
  })).mutation(async ({ ctx, input }) => {
    const existingPages = await getBioPagesWithStatsByUserId(ctx.user.id);
    if (existingPages.length >= MAX_BIO_PAGES_PER_USER) {
      throw new Error(`Bir hesapta en fazla ${MAX_BIO_PAGES_PER_USER} bio sayfas\u0131 olu\u015Fturabilirsiniz`);
    }
    const available = await checkSlugAvailable(input.slug);
    if (!available) throw new Error("Bu slug zaten kullan\u0131l\u0131yor");
    await createBioPage({
      userId: ctx.user.id,
      slug: input.slug,
      title: input.title,
      theme: "dark_grid",
      accentColor: "#22D3EE",
      isPublished: true
    });
    void persistMemorySnapshotNow();
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    slug: z2.string().min(2).max(50).regex(/^[a-z0-9-_]+$/).optional(),
    title: z2.string().min(1).max(200).optional(),
    description: z2.string().max(500).nullable().optional(),
    profileImageUrl: profileImageUrlSchema.nullable().optional(),
    faviconUrl: faviconUrlSchema.nullable().optional(),
    theme: z2.string().optional(),
    accentColor: z2.string().regex(/^#[0-9a-fA-F]{6}$/, "Ge\xE7erli bir renk se\xE7in").optional(),
    selectedThemeId: z2.string().max(50).nullable().optional(),
    textColor: z2.string().regex(/^#[0-9a-fA-F]{6}$/, "Ge\xE7erli bir yaz\u0131 rengi se\xE7in").optional(),
    customBackgroundImageUrl: profileImageUrlSchema.nullable().optional(),
    themeCategory: z2.enum(["solid", "pattern", "photo"]).nullable().optional(),
    isPublished: z2.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (data.slug) {
      const available = await checkSlugAvailable(data.slug, id);
      if (!available) throw new Error("Bu slug zaten kullan\u0131l\u0131yor");
    }
    await updateBioPage(id, ctx.user.id, data);
    void persistMemorySnapshotNow();
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    await deleteBioPage(input.id, ctx.user.id);
    await persistMemorySnapshotNow();
    return { success: true };
  })
});
var bioBlocksRouter = router({
  list: protectedProcedure.input(z2.object({ pageId: z2.number() })).query(async ({ ctx, input }) => {
    const page = await getBioPageById(input.pageId, ctx.user.id);
    if (!page) throw new Error("Sayfa bulunamad\u0131");
    return getBioBlocksByPageId(input.pageId);
  }),
  add: protectedProcedure.input(z2.object({
    pageId: z2.number(),
    type: z2.enum(["heading", "description", "text", "link", "social", "location", "divider", "profile_image"]),
    sortOrder: z2.number(),
    data: z2.record(z2.string(), z2.union([z2.string(), z2.boolean(), z2.number()]))
  })).mutation(async ({ ctx, input }) => {
    const page = await getBioPageById(input.pageId, ctx.user.id);
    if (!page) throw new Error("Sayfa bulunamad\u0131");
    const blocks = await getBioBlocksByPageId(input.pageId);
    if (blocks.length >= 50) throw new Error("Maksimum 50 \xF6\u011Fe s\u0131n\u0131r\u0131na ula\u015Ft\u0131n\u0131z");
    await createBioBlock({
      pageId: input.pageId,
      type: input.type,
      sortOrder: input.sortOrder,
      isEnabled: true,
      data: input.data
    });
    await persistMemorySnapshotNow();
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    pageId: z2.number(),
    isEnabled: z2.boolean().optional(),
    data: z2.record(z2.string(), z2.union([z2.string(), z2.boolean(), z2.number(), z2.null()])).optional()
  })).mutation(async ({ ctx, input }) => {
    const page = await getBioPageById(input.pageId, ctx.user.id);
    if (!page) throw new Error("Sayfa bulunamad\u0131");
    const { id, pageId, ...updateData } = input;
    await updateBioBlock(id, updateData);
    await persistMemorySnapshotNow();
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number(), pageId: z2.number() })).mutation(async ({ ctx, input }) => {
    const page = await getBioPageById(input.pageId, ctx.user.id);
    if (!page) throw new Error("Sayfa bulunamad\u0131");
    await deleteBioBlock(input.id);
    await persistMemorySnapshotNow();
    return { success: true };
  }),
  reorder: protectedProcedure.input(z2.object({
    pageId: z2.number(),
    updates: z2.array(z2.object({ id: z2.number(), sortOrder: z2.number() }))
  })).mutation(async ({ ctx, input }) => {
    const page = await getBioPageById(input.pageId, ctx.user.id);
    if (!page) throw new Error("Sayfa bulunamad\u0131");
    await reorderBioBlocks(input.updates);
    await persistMemorySnapshotNow();
    return { success: true };
  }),
  bulkSave: protectedProcedure.input(z2.object({
    pageId: z2.number(),
    allowEmpty: z2.boolean().optional(),
    blocks: z2.array(z2.object({
      id: z2.number().optional(),
      type: z2.enum(["heading", "description", "text", "link", "social", "location", "divider", "profile_image"]),
      sortOrder: z2.number(),
      isEnabled: z2.boolean(),
      data: z2.record(z2.string(), z2.union([z2.string(), z2.boolean(), z2.number(), z2.null()]))
    }))
  })).mutation(async ({ ctx, input }) => {
    const page = await getBioPageById(input.pageId, ctx.user.id);
    if (!page) throw new Error("Sayfa bulunamad\u0131");
    if (input.blocks.length > 50) throw new Error("Maksimum 50 \xF6\u011Fe s\u0131n\u0131r\u0131na ula\u015Ft\u0131n\u0131z");
    const existingBlocks = await getBioBlocksByPageId(input.pageId);
    if (input.blocks.length === 0 && existingBlocks.length > 0 && !input.allowEmpty) {
      throw new Error("Bo\u015F i\xE7erik kayd\u0131 engellendi. T\xFCm bloklar\u0131 silmek istiyorsan\u0131z \xF6nce tek tek kald\u0131r\u0131n.");
    }
    const existingIds = new Set(existingBlocks.map((block) => block.id));
    const incomingIds = new Set(input.blocks.map((block) => block.id).filter((id) => typeof id === "number"));
    const deleteJobs = existingBlocks.filter((block) => !incomingIds.has(block.id)).map((block) => deleteBioBlock(block.id));
    const saveJobs = input.blocks.map((block) => {
      if (block.id && existingIds.has(block.id)) {
        return updateBioBlock(block.id, {
          sortOrder: block.sortOrder,
          isEnabled: block.isEnabled,
          data: block.data
        });
      }
      return createBioBlock({
        pageId: input.pageId,
        type: block.type,
        sortOrder: block.sortOrder,
        isEnabled: block.isEnabled,
        data: block.data
      });
    });
    await Promise.all([...deleteJobs, ...saveJobs]);
    void persistMemorySnapshotNow();
    return getBioBlocksByPageId(input.pageId);
  })
});
var shortLinksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getShortLinksByUserId(ctx.user.id);
  }),
  create: protectedProcedure.input(z2.object({
    url: shortUrlSchema,
    customCode: customShortCodeSchema
  })).mutation(async ({ ctx, input }) => {
    const code = await getAvailableShortCode(input.url, input.customCode);
    await createShortLink({
      userId: ctx.user.id,
      originalUrl: input.url,
      code,
      clicks: 0
    });
    const path = `/r/${code}`;
    const origin = getRequestOrigin(ctx.req);
    return { code, originalUrl: input.url, shortUrl: origin ? `${origin}${path}` : path };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    await deleteShortLink(input.id, ctx.user.id);
    return { success: true };
  }),
  resolve: publicProcedure.input(z2.object({ code: z2.string() })).query(async ({ input }) => {
    const link = await getShortLinkByCode(input.code);
    if (!link) return null;
    return { originalUrl: link.originalUrl, clicks: link.clicks };
  })
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().trim().min(2, "Kullan\u0131c\u0131 ad\u0131 en az 2 karakter olmal\u0131").max(40, "Kullan\u0131c\u0131 ad\u0131 en fazla 40 karakter olabilir")
    })).mutation(async ({ ctx, input }) => {
      const updatedUser = await updateUserProfileById(ctx.user.id, { name: input.name });
      return updatedUser ?? ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  bioPages: bioPagesRouter,
  bioBlocks: bioBlocksRouter,
  shortLinks: shortLinksRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function detectMapProvider(rawUrl) {
  const value = rawUrl.toLowerCase();
  if (value.includes("maps.apple.com")) return "apple_maps";
  if (value.includes("google.com/maps") || value.includes("maps.google.") || value.includes("maps.app.goo.gl") || value.includes("goo.gl/maps")) return "google_maps";
  return "auto_maps";
}
function buildLocationRedirectUrl(blockData) {
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
function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/resolve-map-url", async (req, res) => {
    const rawUrl = String(req.query.url || "").trim();
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      res.status(400).json({ message: "Gecersiz konum linki" });
      return;
    }
    const allowedHosts = /* @__PURE__ */ new Set([
      "maps.app.goo.gl",
      "goo.gl",
      "www.google.com",
      "google.com",
      "maps.google.com",
      "maps.apple.com"
    ]);
    if (!allowedHosts.has(url.hostname.toLowerCase())) {
      res.status(400).json({ message: "Desteklenmeyen konum linki" });
      return;
    }
    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow"
      });
      res.json({ url: response.url || url.toString() });
    } catch (err) {
      console.error("[MapResolve] Error:", err);
      res.status(502).json({ message: "Konum linki cozumlenemedi" });
    }
  });
  app.post("/api/contact-messages", async (req, res) => {
    try {
      const name = sanitizeContactText(req.body?.name, 80);
      const email = sanitizeContactText(req.body?.email, 120).toLowerCase();
      const subject = sanitizeContactText(req.body?.subject, 120);
      const message = sanitizeContactText(req.body?.message, 2e3);
      if (!name || !email || !message) {
        res.status(400).json({ message: "Ad, e-posta ve mesaj zorunludur." });
        return;
      }
      if (!isValidContactEmail(email)) {
        res.status(400).json({ message: "Geçerli bir e-posta adresi girin." });
        return;
      }
      await createContactMessage({ name, email, subject, message });
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("[Contact] Create failed:", err);
      res.status(500).json({ message: "Mesaj kaydedilemedi." });
    }
  });
  app.get("/api/contact-messages", async (req, res) => {
    if (req.headers["x-admin-password"] !== "247398") {
      res.status(401).json({ message: "Yetkisiz işlem" });
      return;
    }
    try {
      const messages = await getContactMessages();
      res.json({ messages });
    } catch (err) {
      console.error("[Contact] List failed:", err);
      res.status(500).json({ message: "Mesajlar alınamadı." });
    }
  });
  app.delete("/api/contact-messages/:id", async (req, res) => {
    if (req.headers["x-admin-password"] !== "247398") {
      res.status(401).json({ message: "Yetkisiz işlem" });
      return;
    }
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: "Geçersiz mesaj" });
      return;
    }
    const deleted = await deleteContactMessage(id);
    res.json({ success: deleted });
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
      const blockData = block.data;
      const url = block.type === "location" ? buildLocationRedirectUrl(blockData) : blockData?.url;
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
      createContext
    })
  );
  return app;
}
export {
  createApp
};
