import { pgTable, text, serial, json, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const presets = pgTable("presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  data: json("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull().default("inactive"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyticsSessions = pgTable("analytics_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  country: varchar("country", { length: 64 }).default("Unknown"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
});

export const snapshots = pgTable("snapshots", {
  id: varchar("id", { length: 12 }).primaryKey(),
  data: json("data").notNull(),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPresetSchema = createInsertSchema(presets).omit({ id: true, createdAt: true });
export type InsertPreset = z.infer<typeof insertPresetSchema>;
export type Preset = typeof presets.$inferSelect;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;

export type Snapshot = typeof snapshots.$inferSelect;
