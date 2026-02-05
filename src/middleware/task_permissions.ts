import type { Request, Response, NextFunction } from "express";

// Task permissions for the task manager.
export function requireTaskManager(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role ?? "";
  if (role === "admin" || role === "manager" || role === "engineer") return next();
  return res.status(403).send("Forbidden");
}

export function requireTaskOperator(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role ?? "";
  if (role === "admin" || role === "manager" || role === "engineer" || role === "operator") {
    return next();
  }
  return res.status(403).send("Forbidden");
}

export function requireTaskRead(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role ?? "";
  if (role === "admin" || role === "manager" || role === "engineer" || role === "operator" || role === "viewer") {
    return next();
  }
  return res.status(403).send("Forbidden");
}
