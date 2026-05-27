import type { Express } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { authStorage } from "./storage.js";
import { isAuthenticated } from "./replitAuth.js";

export function registerAuthRoutes(app: Express): void {
  // ── REGISTER ────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await authStorage.getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(400).json({ message: "An account with that email already exists" });
      }

      const hash = await bcrypt.hash(password, 12);
      const user = await authStorage.createUser({
        email: email.toLowerCase(),
        password: hash,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Auto-login after register
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login after register failed" });
        const { password: _, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  // ── LOGOUT ──────────────────────────────────────────────────────────────────
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ ok: true });
    });
  });

  // ── GET CURRENT USER ────────────────────────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
