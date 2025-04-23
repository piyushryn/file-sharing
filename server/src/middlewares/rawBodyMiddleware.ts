import { Request, Response, NextFunction } from "express";

/**
 * Middleware to preserve raw body for Stripe webhook signature verification
 */
export const rawBodyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let data = "";

  // Skip middleware if not a Stripe webhook request
  if (req.path !== "/api/payments/stripe/webhook") {
    return next();
  }

  req.setEncoding("utf8");

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", () => {
    // Store raw body for Stripe signature verification
    (req as any).rawBody = data;
    next();
  });
};

export default rawBodyMiddleware;
