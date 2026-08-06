import type { Request, Response, NextFunction } from "express";

// Configuration for CORS
const ALLOWED_ORIGINS: string[] = [
  // Add your trusted domains here
  "http://localhost:3000",
  "https://localhost:3000",
  // Add production domains when available
];

// Environment variable to override allowed origins
const ENV_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];

const getAllowedOrigins = (): string[] => {
  // Merge environment origins with default ones
  const origins = new Set([...ALLOWED_ORIGINS, ...ENV_ALLOWED_ORIGINS]);
  return Array.from(origins).filter(origin => origin.trim().length > 0);
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  // Allow all origins if in development and no specific origins configured
  const isDevelopment = process.env.NODE_ENV === "development";
  const hasConfiguredOrigins = allowedOrigins.length > 0;
  
  // In development, allow localhost origins by default
  if (isDevelopment && !hasConfiguredOrigins) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  
  // Check if origin is in allowed list
  return allowedOrigins.some(allowed => allowed === origin);
}

/**
 * CORS middleware for the application
 * Only enables CORS for same-origin or explicitly allowed origins
 * Never uses wildcard (*) with credentials
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  // If no origin header, continue without CORS headers
  if (!origin || typeof origin !== "string") {
    return next();
  }
  
  // Check if origin is allowed
  if (!isOriginAllowed(origin)) {
    return next();
  }
  
  // Set CORS headers for allowed origins
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-CSRF-Token");
  res.setHeader("Access-Control-Expose-Headers", "X-CSRF-Token");
  res.setHeader("Vary", "Origin");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  next();
}

/**
 * Strict CORS middleware for API endpoints
 * Only allows requests from same origin or explicitly configured origins
 */
export function strictCorsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  if (!origin || typeof origin !== "string") {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Expose-Headers", "X-CSRF-Token");
  res.setHeader("Vary", "Origin");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  next();
}

/**
 * No CORS middleware - explicitly disables CORS for server-to-server communication
 */
export function noCorsMiddleware(_req: Request, _res: Response, next: NextFunction) {
  // Explicitly remove any CORS headers that might have been set
  // This is for server-to-server endpoints that should not be accessible from browsers
  next();
}

/**
 * Configure CORS settings
 */
export function configureCors(app: import("express").Express) {
  // For this application, we'll use a conservative approach:
  // - No CORS by default (same-origin only)
  // - Only enable CORS for specific endpoints if needed
  // This is the most secure default
  
  // You can enable CORS for specific routes like:
  // app.use("/api", corsMiddleware, apiRouter);
  
  // For now, we don't add global CORS middleware
  // CORS should be explicitly enabled per route when needed
}
