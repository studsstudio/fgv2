import express, { type Express } from "express";
import path from "path";

export function serveStatic(app: Express) {
  // Serve all static files (JS modules, CSS, etc) from the project root
  const rootPath = path.resolve(process.cwd());
  app.use(express.static(rootPath));

  // Serve index.html for all non-API routes
  app.use("/{*path}", (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).json({ message: "Not found" });
    res.sendFile(path.resolve(rootPath, "index.html"));
  });
}
