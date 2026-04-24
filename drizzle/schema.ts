import {
  bigint,
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Auth users table (from Supabase auth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 320 }),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Profiles table
export const profiles = pgTable("profiles", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 50 }).notNull().unique(),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  avatarKey: varchar("avatar_key", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// Links table
export const links = pgTable("links", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Link = typeof links.$inferSelect;
export type InsertLink = typeof links.$inferInsert;

// Link clicks table
export const linkClicks = pgTable("link_clicks", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  linkId: bigint("link_id", { mode: "number" }).notNull().references(() => links.id, { onDelete: "cascade" }),
  clickedAt: timestamp("clicked_at").defaultNow(),
});

export type LinkClick = typeof linkClicks.$inferSelect;
export type InsertLinkClick = typeof linkClicks.$inferInsert;

// Bio pages table (keeping for backward compatibility)
export const bioPages = pgTable("bio_pages", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  profileImageUrl: text("profileImageUrl"),
  theme: varchar("theme", { length: 50 }).default("dark_grid"),
  accentColor: varchar("accentColor", { length: 20 }).default("#DFFF00"),
  isPublished: boolean("isPublished").default(true),
  views: integer("views").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type BioPage = typeof bioPages.$inferSelect;
export type InsertBioPage = typeof bioPages.$inferInsert;

// Bio blocks table (keeping for backward compatibility)
export const bioBlocks = pgTable("bio_blocks", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  pageId: bigint("pageId", { mode: "number" }).notNull().references(() => bioPages.id, { onDelete: "cascade" }),
  type: pgEnum("type", [
    "heading",
    "description",
    "text",
    "link",
    "social",
    "divider",
    "profile_image",
  ])("type").notNull(),
  sortOrder: integer("sortOrder").default(0),
  isEnabled: boolean("isEnabled").default(true),
  clicks: integer("clicks").default(0),
  data: json("data").$type<Record<string, string | boolean | number>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type BioBlock = typeof bioBlocks.$inferSelect;
export type InsertBioBlock = typeof bioBlocks.$inferInsert;

// Short links table (keeping for backward compatibility)
export const shortLinks = pgTable("short_links", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  originalUrl: text("originalUrl").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  clicks: integer("clicks").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = typeof shortLinks.$inferInsert;

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  links: many(links),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  clicks: many(linkClicks),
}));

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
  link: one(links, {
    fields: [linkClicks.linkId],
    references: [links.id],
  }),
}));

export const bioPagesRelations = relations(bioPages, ({ one, many }) => ({
  user: one(users, {
    fields: [bioPages.userId],
    references: [users.id],
  }),
  blocks: many(bioBlocks),
}));

export const bioBlocksRelations = relations(bioBlocks, ({ one }) => ({
  page: one(bioPages, {
    fields: [bioBlocks.pageId],
    references: [bioPages.id],
  }),
}));
