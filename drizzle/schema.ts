import { integer, pgTable, text, timestamp, varchar, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  status: varchar("status", { length: 20 }).default("QUEUED").notNull(),
  sunoTaskId: varchar("sunoTaskId", { length: 128 }),
  lyricsTaskId: varchar("lyricsTaskId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

export const songs = pgTable("songs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  jobId: varchar("jobId", { length: 64 }).notNull(),
  title: text("title"),
  lyrics: text("lyrics"),
  audioUrl: text("audioUrl"),
  imageUrl: text("imageUrl"),
  duration: integer("duration").default(0),
  tags: varchar("tags", { length: 255 }),
  modelName: varchar("modelName", { length: 64 }),
  shareSlug: varchar("shareSlug", { length: 128 }).unique(),
  downloadCount: integer("downloadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

export const leads = pgTable("leads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  jobId: varchar("jobId", { length: 64 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  name: text("name").notNull(),
  style: varchar("style", { length: 64 }).notNull(),
  occasion: text("occasion"),
  story: text("story").notNull(),
  mood: varchar("mood", { length: 64 }),
  language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
