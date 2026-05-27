import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage.js";

// ── SESSION SETUP ─────────────────────────────────────────────────────────────
export function getSession() {
  const secret = process.env.SESSION_SECRET || "fallback-dev-secret-change-in-prod";
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

// ── PASSPORT LOCAL STRATEGY ───────────────────────────────────────────────────
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await authStorage.getUserByEmail(email.toLowerCase());
      if (!user || !user.password) {
        return done(null, false, { message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return done(null, false, { message: "Invalid email or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authStorage.getUser(id);
    done(null, user ?? null);
  } catch (err) {
    done(err);
  }
});

// ── SETUP AUTH MIDDLEWARE ─────────────────────────────────────────────────────
export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
}

// ── AUTH GUARD ────────────────────────────────────────────────────────────────
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};
