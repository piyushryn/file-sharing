import { Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { IUser } from "../../models/UserModel";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

/**
 * Middleware to authenticate users with JWT
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error, user: IUser) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid token" });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

/**
 * Middleware to just add user to request object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */

export const addUserDataToRequestIfSignedIn = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error, user: IUser) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        next();
        return;
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

/**
 * Middleware to check if user is an admin
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden - Admin access required" });
  }
  next();
};

/**
 * Generate JWT token for authenticated user
 * @param user - User object
 * @returns JWT token
 */
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};
