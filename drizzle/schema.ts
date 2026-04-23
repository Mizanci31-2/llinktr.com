import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  longtext,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Bio pages table
export const bioPages = mysqlTable("bio_pages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  profileImageUrl: longtext("profileImageUrl"),
  theme: varchar("theme", { length: 50 }).default("dark_grid").notNull(),
  accentColor: varchar("accentColor", { length: 20 }).default("#DFFF00").notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BioPage = typeof bioPages.$inferSelect;
export type InsertBioPage = typeof bioPages.$inferInsert;

// Bio blocks table
export const bioBlocks = mysqlTable("bio_blocks", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  type: mysqlEnum("type", [
    "heading",
    "description",
    "text",
    "link",
    "social",
    "divider",
    "profile_image",
  ]).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  clicks: int("clicks").default(0).notNull(),
  // JSON data for block-specific fields
  data: json("data").$type<Record<string, string | boolean | number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BioBlock = typeof bioBlocks.$inferSelect;
export type InsertBioBlock = typeof bioBlocks.$inferInsert;

// Short links table
export const shortLinks = mysqlTable("short_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  originalUrl: text("originalUrl").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  clicks: int("clicks").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = typeof shortLinks.$inferInsert;
