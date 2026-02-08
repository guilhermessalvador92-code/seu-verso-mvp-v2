import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleSunoCallback, webhookHealthCheck, webhookTest, handleLyricsCallback } from "../webhook";
import { getJobById, getSongsByJobId } from "../db";
import { handleFluxuzConfirmation } from "../fluxuz";
// Email system removed - using WhatsApp only
import { initializeDatabaseSchema } from "../db-init";
import lyricsRoutes from "../routes-lyrics";
import musicRoutes from "../routes-music";
import webhooksRoutes from "../routes-webhooks";
import path from "path";
import { fileURLToPath } from "url";

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
  return startPort;
}

async function startServer() {
  // CRITICAL: Initialize database schema FIRST, before anything else
  console.log("[Server] Starting initialization sequence...");
  console.log("[Server] Step 1: Initializing database schema...");
  
  try {
    const schemaInitialized = await initializeDatabaseSchema();
    if (!schemaInitialized) {
      console.warn("[Server] ⚠️  Database schema initialization had issues, but continuing...");
    } else {
      console.log("[Server] ✅ Database schema initialized successfully");
    }
  } catch (error) {
    console.error("[Server] ❌ Database initialization failed:", error);
    // Continue anyway - the server can still start
  }

  // Now initialize Express
  console.log("[Server] Step 2: Initializing Express server...");
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
  app.post("/api/webhook/lyrics", handleLyricsCallback);
  app.get("/api/webhook/health", webhookHealthCheck);
  app.post("/api/webhook/test", webhookTest);
  
  // Fluxuz confirmation endpoint
  app.post("/api/fluxuz/confirmation", handleFluxuzConfirmation);
  
  // Premium API routes
  app.use("/api/lyrics", lyricsRoutes);
  app.use("/api/music", musicRoutes);
  app.use("/api/webhooks", webhooksRoutes);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Tester Feedback endpoints
  app.post("/api/tester-feedback/pre", async (req, res) => {
    try {
      const { jobId, recipient, emotion, pricePerception } = req.body;
      console.log("[Feedback-PRE] Received feedback for job:", jobId, { recipient, emotion, pricePerception });
      res.json({ success: true, message: "Feedback PRE recebido com sucesso" });
    } catch (err) {
      console.error("[Feedback-PRE] Error saving feedback", err);
      res.status(500).json({ success: false, error: "Erro interno ao salvar feedback" });
    }
  });

  app.post("/api/tester-feedback/post", async (req, res) => {
    try {
      const { jobId, nps, feedback, consent } = req.body;
      console.log("[Feedback-POST] Received feedback for job:", jobId, { nps, feedback, consent });
      
      // Por enquanto apenas logamos, mas o endpoint retorna sucesso para liberar o player no front
      res.json({ success: true, message: "Feedback recebido com sucesso" });
    } catch (err) {
      console.error("[Feedback-POST] Error saving feedback", err);
      res.status(500).json({ success: false, error: "Erro interno ao salvar feedback" });
    }
  });

  // REST status endpoint
  app.get("/api/status-simple/:jobId", async (req, res) => {
    try {
      const job = await getJobById(req.params.jobId);
      if (!job) {
        return res.status(404).json({ status: "NOT_FOUND" });
      }
      const songs = await getSongsByJobId(req.params.jobId);
      
      // Ordenar músicas por data de criação para manter consistência (v1, v2)
      const sortedSongs = (songs || []).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

      res.json({
        status: job.status,
        songs: sortedSongs.map(s => ({
          title: s.title,
          audioUrl: s.audioUrl,
          lyrics: s.lyrics,
          shareSlug: s.shareSlug,
        })),
      });
    } catch (err) {
      console.error("[Status] Error getting job", err);
      res.status(500).json({ status: "ERROR" });
    }
  });

  // Status page
  app.get("/status/:jobId", (req, res, next) => {
    const currentDir = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url)) || process.cwd();
    const statusPath = path.resolve(currentDir, "../public/status.html");
    res.sendFile(statusPath, err => {
      if (err) next();
    });
  });

  // Log webhook URLs
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  console.log(`[Server] Webhook URL: ${appUrl}/api/webhook/suno`);
  
  // Setup Vite or static files
  console.log("[Server] Step 3: Setting up frontend...");
    if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Find available port and start listening
  console.log("[Server] Step 4: Starting HTTP server...");
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[Server] Port ${preferredPort} busy, using ${port}`);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Server] ✅ Server running on http://0.0.0.0:${port}/`);
    console.log(`[Server] ✅ All initialization complete!`);
    console.log(`[Server] 📱 WhatsApp integration ready - Fluxuz will handle messaging`);
  });
}

startServer().catch(err => {
  console.error("[Server] ❌ Fatal error:", err);
  process.exit(1);
});
