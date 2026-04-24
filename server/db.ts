import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  profiles,
  links,
  linkClicks,
  users,
  type Profile,
  type Link,
  type LinkClick,
  type InsertUser,
  type User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();

  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
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

    // PostgreSQL upsert
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existingUser.length > 0) {
      await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
    } else {
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Profile operations
export async function getProfileByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProfile(data: {
  userId: number;
  username: string;
  bio?: string;
  avatarUrl?: string;
  avatarKey?: string;
}) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(profiles).values({
    userId: data.userId,
    username: data.username,
    bio: data.bio || null,
    avatarUrl: data.avatarUrl || null,
    avatarKey: data.avatarKey || null,
  }).returning();

  return result[0];
}

export async function updateProfile(userId: number, data: Partial<{
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarKey: string | null;
}>) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.update(profiles)
    .set(data)
    .where(eq(profiles.userId, userId))
    .returning();

  return result[0];
}

// Link operations
export async function getLinksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(links)
    .where(eq(links.userId, userId))
    .orderBy(links.order);
}

export async function getLinkById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(links).where(eq(links.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLink(data: {
  userId: number;
  title: string;
  url: string;
  order: number;
}) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(links).values({
    userId: data.userId,
    title: data.title,
    url: data.url,
    order: data.order,
  }).returning();

  return result[0];
}

export async function updateLink(id: number, userId: number, data: Partial<{
  title: string;
  url: string;
  order: number;
}>) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.update(links)
    .set(data)
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .returning();

  return result[0];
}

export async function deleteLink(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(links).where(and(eq(links.id, id), eq(links.userId, userId)));
  return true;
}

export async function reorderLinks(userId: number, linkIds: number[]) {
  const db = await getDb();
  if (!db) return;

  for (let i = 0; i < linkIds.length; i++) {
    await db.update(links)
      .set({ order: i })
      .where(and(eq(links.id, linkIds[i]), eq(links.userId, userId)));
  }
}

// Link click tracking
export async function recordLinkClick(linkId: number) {
  const db = await getDb();
  if (!db) return;

  await db.insert(linkClicks).values({
    linkId,
    clickedAt: new Date(),
  });
}

export async function getLinkClickCount(linkId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: linkClicks.id }).from(linkClicks).where(eq(linkClicks.linkId, linkId));
  return result.length > 0 ? result.length : 0;
}

export async function getLinkClicksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    linkId: linkClicks.linkId,
    count: linkClicks.id,
  }).from(linkClicks)
    .innerJoin(links, eq(linkClicks.linkId, links.id))
    .where(eq(links.userId, userId));
}
