import { db } from "./db.js";
import { presets, subscriptions, analyticsSessions, snapshots, type Preset, type InsertPreset, type Snapshot } from "../shared/schema.js";
import { users } from "../shared/models/auth.js";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Presets
  getPresets(userId: string): Promise<Preset[]>;
  createPreset(preset: InsertPreset): Promise<Preset>;
  deletePreset(id: number, userId: string): Promise<void>;

  // Subscriptions / Stripe
  getSubscriptionStatus(userId: string): Promise<{ isActive: boolean; status: string | null }>;
  getStripeCustomerId(userId: string): Promise<string | null>;
  saveStripeCustomerId(userId: string, customerId: string): Promise<void>;
  getProPriceId(): Promise<string | null>;

  // Analytics sessions
  createSession(userId: string, country: string): Promise<number>;
  endSession(sessionId: number, durationSeconds: number): Promise<void>;
  getAdminStats(): Promise<{
    users: Array<{ id: string; email: string | null; firstName: string | null; lastName: string | null; lastSeenAt: Date | null; subscriptionStatus: string | null; totalSeconds: number; sessionCount: number }>;
    countries: Array<{ country: string; count: number }>;
    totals: { userCount: number; sessionCount: number; totalHours: number };
  }>;

  // Snapshots
  createSnapshot(data: unknown, userId?: string): Promise<Snapshot>;
  getSnapshot(id: string): Promise<Snapshot | null>;
}

function generateId(len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

class DatabaseStorage implements IStorage {
  // ── PRESETS ──────────────────────────────────────────────────────────────────

  async getPresets(userId: string): Promise<Preset[]> {
    return await db.select().from(presets).where(eq(presets.userId, userId));
  }

  async createPreset(preset: InsertPreset): Promise<Preset> {
    const [created] = await db.insert(presets).values(preset).returning();
    return created;
  }

  async deletePreset(id: number, userId: string): Promise<void> {
    await db.delete(presets).where(eq(presets.id, id));
  }

  // ── SUBSCRIPTION STATUS ───────────────────────────────────────────────────────

  async getSubscriptionStatus(userId: string): Promise<{ isActive: boolean; status: string | null }> {
    const [localSub] = await db
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    const status = localSub?.status ?? null;
    const isActive = status === "active" || status === "trialing";
    return { isActive, status };
  }

  async getStripeCustomerId(userId: string): Promise<string | null> {
    const [sub] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return sub?.stripeCustomerId ?? null;
  }

  async saveStripeCustomerId(userId: string, customerId: string): Promise<void> {
    await db
      .insert(subscriptions)
      .values({ userId, stripeCustomerId: customerId, status: "pending" })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { stripeCustomerId: customerId, updatedAt: new Date() },
      });
  }

  // ── PRO PRICE ─────────────────────────────────────────────────────────────────
  // Price ID is now set directly via env var — no stripe.* schema needed
  async getProPriceId(): Promise<string | null> {
    return process.env.STRIPE_PRO_PRICE_ID ?? null;
  }

  // ── ANALYTICS SESSIONS ────────────────────────────────────────────────────────

  async createSession(userId: string, country: string): Promise<number> {
    const [s] = await db
      .insert(analyticsSessions)
      .values({ userId, country, startedAt: new Date() })
      .returning({ id: analyticsSessions.id });
    return s.id;
  }

  async endSession(sessionId: number, durationSeconds: number): Promise<void> {
    await db
      .update(analyticsSessions)
      .set({ endedAt: new Date(), durationSeconds })
      .where(eq(analyticsSessions.id, sessionId));
  }

  async getAdminStats() {
    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        lastSeenAt: users.updatedAt,
        subscriptionStatus: subscriptions.status,
        totalSeconds: sql<number>`COALESCE(SUM(${analyticsSessions.durationSeconds}), 0)::int`,
        sessionCount: sql<number>`COUNT(${analyticsSessions.id})::int`,
      })
      .from(users)
      .leftJoin(analyticsSessions, eq(analyticsSessions.userId, users.id))
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .groupBy(users.id, subscriptions.status)
      .orderBy(desc(users.updatedAt));

    const countryRows = await db
      .select({
        country: analyticsSessions.country,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(analyticsSessions)
      .groupBy(analyticsSessions.country)
      .orderBy(desc(sql`COUNT(*)`));

    const [totalsRow] = await db
      .select({
        userCount: sql<number>`COUNT(DISTINCT ${users.id})::int`,
        sessionCount: sql<number>`COUNT(${analyticsSessions.id})::int`,
        totalSeconds: sql<number>`COALESCE(SUM(${analyticsSessions.durationSeconds}), 0)::int`,
      })
      .from(users)
      .leftJoin(analyticsSessions, eq(analyticsSessions.userId, users.id));

    return {
      users: userRows.map(r => ({
        ...r,
        totalSeconds: Number(r.totalSeconds),
        sessionCount: Number(r.sessionCount),
      })),
      countries: countryRows.map(r => ({ country: r.country ?? "Unknown", count: Number(r.count) })),
      totals: {
        userCount: Number(totalsRow?.userCount ?? 0),
        sessionCount: Number(totalsRow?.sessionCount ?? 0),
        totalHours: Math.round(Number(totalsRow?.totalSeconds ?? 0) / 3600 * 10) / 10,
      },
    };
  }

  // ── SNAPSHOTS ─────────────────────────────────────────────────────────────────

  async createSnapshot(data: unknown, userId?: string): Promise<Snapshot> {
    let id = generateId(8);
    const existing = await db.select({ id: snapshots.id }).from(snapshots).where(eq(snapshots.id, id));
    if (existing.length > 0) id = generateId(8);
    const [snap] = await db.insert(snapshots).values({ id, data, userId: userId ?? null }).returning();
    return snap;
  }

  async getSnapshot(id: string): Promise<Snapshot | null> {
    const [snap] = await db.select().from(snapshots).where(eq(snapshots.id, id));
    return snap ?? null;
  }
}

export const storage = new DatabaseStorage();
