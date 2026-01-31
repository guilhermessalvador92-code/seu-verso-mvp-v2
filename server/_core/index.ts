import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleSunoCallback, webhookHealthCheck, webhookTest } from "../webhook";
import { getJobById, getSongsByJobId } from "../db";
import { startEmailQueueWorker } from "../email-retry";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db";
import mysql from "mysql2/promise";
import fs from "fs";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  // If no port found, return the preferred port anyway (will fail with clear error on bind)
  return startPort;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Content Security Policy header
  app.use((req, res, next) => {
    const isDev = process.env.NODE_ENV === "development";
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "media-src 'self' https://musicfile.api.box",
        "connect-src 'self' https://musicfile.api.box https://generativelanguage.googleapis.com https://api.sunoapi.org",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Webhook routes for Suno API callbacks
  app.post("/api/webhook/suno", handleSunoCallback);
  app.get("/api/webhook/health", webhookHealthCheck);
  app.post("/api/webhook/test", webhookTest);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // REST status endpoint (sem eval, sem bundler)
  app.get("/api/status-simple/:jobId", async (req, res) => {
    try {
      const job = await getJobById(req.params.jobId);
      if (!job) {
        return res.status(404).json({ status: "NOT_FOUND" });
      }
      const songs = await getSongsByJobId(req.params.jobId);
      res.json({
        status: job.status,
        songs: songs?.map(s => ({
          title: s.title,
          audioUrl: s.audioUrl,
          lyrics: s.lyrics,
          shareSlug: s.shareSlug,
        })) || [],
      });
    } catch (err) {
      console.error("[Status] Falha ao obter job", err);
      res.status(500).json({ status: "ERROR" });
    }
  });

  // Página de entrega minimalista sem depender do bundle React
  app.get("/status/:jobId", (req, res, next) => {
    const currentDir = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url)) || process.cwd();
    const statusPath = path.resolve(currentDir, "../public/status.html");
    res.sendFile(statusPath, err => {
      if (err) next();
    });
  });
  // development mode uses Vite, production mode uses static files
  // Log webhook URL
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  console.log(`[Webhook] Suno callback URL: ${appUrl}/api/webhook/suno`);
  console.log(`[Webhook] Health check URL: ${appUrl}/api/webhook/health`);
  console.log(`[Webhook] Test endpoint URL: ${appUrl}/api/webhook/test`);
  
  // Auto-create tables on startup if they don't exist
  try {
    console.log("[Database] Initializing database schema...");
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (DATABASE_URL) {
      const connection = await mysql.createConnection(DATABASE_URL);
      const currentDir = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url)) || process.cwd();
      const sqlPath = path.resolve(currentDir, "../../scripts/init-db.sql");
      
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, "utf8");
        const statements = sql.split(";").filter((s: string) => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await connection.execute(statement);
            } catch (err: any) {
              // Ignore errors if tables already exist
              if (!err.message.includes("already exists")) {
                console.warn("[Database] SQL warning:", err.message.substring(0, 100));
              }
            }
          }
        }
        console.log("[Database] Schema initialized successfully");
      } else {
        console.warn("[Database] SQL file not found at", sqlPath);
      }
      
      await connection.end();
    } else {
      console.warn("[Database] DATABASE_URL not configured, skipping schema initialization");
    }
  } catch (err: any) {
    console.warn("[Database] Initialization warning:", err.message);
    // Don't fail startup - tables might already exist
  }
  
  // Iniciar worker de processamento de email
  startEmailQueueWorker(30000); // Processar emails a cada 30 segundos
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
