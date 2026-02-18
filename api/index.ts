import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import * as fs from "fs";
import * as path from "path";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS setup - allow all origins for mobile app
app.use((req, res, next) => {
  const origin = req.header("origin");
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Cookie");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// Landing page helper
function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "FonCloud";
  } catch {
    return "FonCloud";
  }
}

// Serve landing page at root
app.get("/", (req: Request, res: Response) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      "server",
      "templates",
      "landing-page.html"
    );
    const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
    const appName = getAppName();

    const forwardedProto = req.header("x-forwarded-proto");
    const protocol = forwardedProto || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host");
    const host = forwardedHost || req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const expsUrl = `${host}`;

    const html = landingPageTemplate
      .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
      .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
      .replace(/APP_NAME_PLACEHOLDER/g, appName);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (error) {
    console.error("Landing page error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Register all API routes
let routesRegistered = false;
let routePromise: Promise<void> | null = null;

function ensureRoutes(): Promise<void> {
  if (routesRegistered) return Promise.resolve();
  if (!routePromise) {
    routePromise = registerRoutes(app).then(() => {
      routesRegistered = true;
    });
  }
  return routePromise;
}

// Error handler
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  const error = err as {
    status?: number;
    statusCode?: number;
    message?: string;
  };
  const status = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  console.error("Internal Server Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(status).json({ message });
});

// Initialize routes eagerly
ensureRoutes();

export default app;
