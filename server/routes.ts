import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth.js";
import { registerAuthRoutes } from "./replit_integrations/auth/routes.js";
import { insertPresetSchema } from "../shared/schema.js";
import { z } from "zod";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID ?? "";

function isAdmin(userId: string) {
  return ADMIN_USER_ID && userId === ADMIN_USER_ID;
}

function getCountry(req: Request): string {
  // Cloudflare header (populated on Replit deployments)
  const cf = req.headers["cf-ipcountry"] as string | undefined;
  if (cf && cf !== "XX" && cf !== "T1") return cf;
  return "Unknown";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAuthRoutes(app);

  // ── SUBSCRIPTION STATUS ───────────────────────────────────────────
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const admin = isAdmin(userId);
      // Admin always has full access
      if (admin) {
        return res.json({ isActive: true, status: "active", isAdmin: true });
      }
      const result = await storage.getSubscriptionStatus(userId);
      res.json({ ...result, isAdmin: false });
    } catch (err) {
      console.error("Error fetching subscription:", err);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // ── SESSION TRACKING ──────────────────────────────────────────────
  app.post("/api/session/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const country = getCountry(req);
      const sessionId = await storage.createSession(userId, country);
      res.json({ sessionId });
    } catch (err) {
      console.error("Session start error:", err);
      res.status(500).json({ message: "Failed to start session" });
    }
  });

  app.post("/api/session/end", isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, durationSeconds } = req.body;
      if (sessionId && durationSeconds > 0) {
        await storage.endSession(Number(sessionId), Math.round(durationSeconds));
      }
      res.json({ ok: true });
    } catch (err) {
      console.error("Session end error:", err);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // ── ADMIN STATS ───────────────────────────────────────────────────
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!isAdmin(userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const stats = await storage.getAdminStats();
      // Inject role: admin > pro > user
      const enriched = stats.users.map(u => ({
        ...u,
        role: isAdmin(u.id)
          ? "admin"
          : (u.subscriptionStatus === "active" || u.subscriptionStatus === "trialing")
            ? "pro"
            : "user",
      }));
      res.json({ ...stats, users: enriched });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ── CREATE CHECKOUT SESSION ───────────────────────────────────────
  app.post("/api/subscription/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const userId = req.user.id;
      const userEmail = req.user.email;
      const origin = `${req.protocol}://${req.hostname}`;

      let customerId = await storage.getStripeCustomerId(userId);
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.saveStripeCustomerId(userId, customerId);
      }

      const priceId = await storage.getProPriceId();
      if (!priceId) {
        return res.status(500).json({ message: "Pro plan not found. Please run the seed script." });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/?checkout=success`,
        cancel_url: `${origin}/?checkout=cancelled`,
        subscription_data: { metadata: { userId } },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: err.message || "Failed to create checkout session" });
    }
  });

  // ── CUSTOMER PORTAL ───────────────────────────────────────────────
  app.post("/api/subscription/portal", isAuthenticated, async (req: any, res) => {
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const userId = req.user.id;
      const origin = `${req.protocol}://${req.hostname}`;

      const customerId = await storage.getStripeCustomerId(userId);
      if (!customerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: origin,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Portal error:", err);
      res.status(500).json({ message: err.message || "Failed to create portal session" });
    }
  });

  // ── PRESETS ───────────────────────────────────────────────────────
  app.get("/api/presets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userPresets = await storage.getPresets(userId);
      res.json(userPresets);
    } catch (err) {
      console.error("Error fetching presets:", err);
      res.status(500).json({ message: "Failed to fetch presets" });
    }
  });

  app.post("/api/presets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const body = insertPresetSchema.parse({ ...req.body, userId });
      const preset = await storage.createPreset(body);
      res.status(201).json(preset);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error creating preset:", err);
      res.status(500).json({ message: "Failed to create preset" });
    }
  });

  app.delete("/api/presets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.deletePreset(Number(req.params.id), userId);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting preset:", err);
      res.status(500).json({ message: "Failed to delete preset" });
    }
  });

  // ── SNAPSHOTS (public — no auth required) ──────────────────────────────────
  app.post("/api/snapshots", async (req: any, res) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ message: "Invalid snapshot data" });
      }
      const userId = req.user?.id ?? undefined;
      const snap = await storage.createSnapshot(data, userId);
      res.json({ id: snap.id });
    } catch (err) {
      console.error("Error creating snapshot:", err);
      res.status(500).json({ message: "Failed to create snapshot" });
    }
  });

  app.get("/api/snapshots/:id", async (req, res) => {
    try {
      const snap = await storage.getSnapshot(req.params.id);
      if (!snap) return res.status(404).json({ message: "Snapshot not found" });
      res.json(snap.data);
    } catch (err) {
      console.error("Error fetching snapshot:", err);
      res.status(500).json({ message: "Failed to fetch snapshot" });
    }
  });

  return httpServer;
}
