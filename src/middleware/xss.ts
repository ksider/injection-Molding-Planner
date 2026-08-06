import type { Request, Response, NextFunction } from "express";

// HTML entity map for XSS prevention
const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};

/**
 * Escape HTML special characters to prevent XSS
 * This is more comprehensive than the basic escapeHtml in app.ts
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  const str = String(value);
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Escape HTML attributes to prevent XSS in attribute contexts
 */
export function escapeHtmlAttribute(value: unknown): string {
  return escapeHtml(value).replace(/\s/g, "&#x20;");
}

/**
 * Escape JavaScript to prevent XSS in script contexts
 */
export function escapeJs(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  const str = String(value);
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\'/g, "\\'")
    .replace(/\"/g, "\\\"")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Escape URL to prevent XSS in href/src contexts
 */
export function escapeUrl(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  const str = String(value);
  // Basic URL validation - only allow http, https, mailto, tel schemes
  if (/^[a-z]+:/i.test(str) && !/^(https?|mailto|tel):/i.test(str)) {
    return "#"; // Block unsafe schemes
  }
  
  return str.replace(/javascript:/gi, "#");
}

/**
 * Create a safe text for display in HTML
 */
export function safeText(value: unknown): string {
  return escapeHtml(value);
}

/**
 * Middleware to add XSS protection functions to response locals
 */
export function xssProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  res.locals.escapeHtml = escapeHtml;
  res.locals.escapeHtmlAttribute = escapeHtmlAttribute;
  res.locals.escapeJs = escapeJs;
  res.locals.escapeUrl = escapeUrl;
  res.locals.safeText = safeText;
  
  // Also add a safe function that can be used in templates
  res.locals.safe = (value: unknown) => {
    return safeText(value);
  };
  
  next();
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const DANGEROUS_PROTOTYPES = [
    "__proto__",
    "constructor",
    "prototype"
  ];
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_PROTOTYPES.includes(key)) {
      continue; // Skip dangerous keys
    }
    
    if (typeof value === "string") {
      sanitized[key] = escapeHtml(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}
