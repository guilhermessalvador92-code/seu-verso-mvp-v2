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
import path from "path";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Content Security Policy header
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "media-src 'self' https://musicfile.api.box",
        "connect-src 'self' https://musicfile.api.box",
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
    const statusPath = path.resolve(import.meta.dirname, "../public/status.html");
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
