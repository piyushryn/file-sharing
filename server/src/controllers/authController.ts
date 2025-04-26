import { Request, Response } from "express";
import crypto from "crypto";
import passport from "passport";
import UserModel, { IUser } from "../models/UserModel";
import { generateToken } from "../middlewares/auth/authMiddleware";

// Helper function to generate request ID for tracking
const generateRequestId = () => crypto.randomBytes(8).toString("hex");

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] [register] Request received:`, {
    body: { ...req.body, password: "***HIDDEN***" },
    ip: req.ip,
  });

  try {
    const { email, password, name } = req.body;

    // Check if required fields are present
    if (!email || !password || !name) {
      console.log(`[${requestId}] [register] Missing required fields`);
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log(`[${requestId}] [register] Email already registered:`, email);
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // Create new user
    const user = new UserModel({
      email,
      password,
      name,
    });

    await user.save();
    console.log(
      `[${requestId}] [register] User registered successfully:`,
      email
    );

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error(`[${requestId}] [register] Error registering user:`, error);
    if (error.name === "ValidationError") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error registering user" });
    }
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = (req: Request, res: Response): void => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] [login] Request received:`, {
    body: { email: req.body.email, password: "***HIDDEN***" },
    ip: req.ip,
  });

  passport.authenticate(
    "local",
    { session: false },
    (err: Error, user: IUser, info: any) => {
      if (err) {
        console.error(
          `[${requestId}] [login] Error during authentication:`,
          err
        );
        return res
          .status(500)
          .json({ message: "Internal server error during login" });
      }

      if (!user) {
        console.log(
          `[${requestId}] [login] Authentication failed:`,
          info?.message
        );
        return res
          .status(401)
          .json({ message: info?.message || "Invalid email or password" });
      }

      // Generate JWT token
      const token = generateToken(user);
      console.log(
        `[${requestId}] [login] User authenticated successfully:`,
        user.email
      );

      // Return user data and token
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
      });
    }
  )(req, res);
};

/**
 * Get current authenticated user
 * @route GET /api/auth/me
 */
export const getCurrentUser = (req: Request, res: Response): void => {
  const requestId = generateRequestId();
  console.log(
    `[${requestId}] [getCurrentUser] Request received from user:`,
    req.user?._id
  );

  if (!req.user) {
    console.log(`[${requestId}] [getCurrentUser] No authenticated user found`);
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  console.log(
    `[${requestId}] [getCurrentUser] Returning user data for:`,
    req.user.email
  );
  res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      isAdmin: req.user.isAdmin,
      createdAt: req.user.createdAt,
    },
  });
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = (req: Request, res: Response): void => {
  const requestId = generateRequestId();
  console.log(
    `[${requestId}] [logout] Request received from user:`,
    req.user?._id
  );

  // Since we're using JWT, we don't need to do anything server-side for logout
  // The client should discard the token

  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestId = generateRequestId();
  console.log(
    `[${requestId}] [updateProfile] Request received from user:`,
    req.user?._id
  );

  if (!req.user) {
    console.log(`[${requestId}] [updateProfile] No authenticated user found`);
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const { name, email } = req.body;
    const updates: { name?: string; email?: string } = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    if (Object.keys(updates).length === 0) {
      console.log(`[${requestId}] [updateProfile] No fields to update`);
      res.status(400).json({ message: "No fields to update" });
      return;
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        console.log(
          `[${requestId}] [updateProfile] Email already taken:`,
          email
        );
        res.status(409).json({ message: "Email already taken" });
        return;
      }
    }

    // Update user profile
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      console.log(
        `[${requestId}] [updateProfile] User not found:`,
        req.user._id
      );
      res.status(404).json({ message: "User not found" });
      return;
    }

    console.log(
      `[${requestId}] [updateProfile] User profile updated:`,
      req.user._id
    );
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    console.error(
      `[${requestId}] [updateProfile] Error updating profile:`,
      error
    );
    res.status(500).json({ message: "Error updating profile" });
  }
};

/**
 * Change password
 * @route PUT /api/auth/change-password
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestId = generateRequestId();
  console.log(
    `[${requestId}] [changePassword] Request received from user:`,
    req.user?._id
  );

  if (!req.user) {
    console.log(`[${requestId}] [changePassword] No authenticated user found`);
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      console.log(`[${requestId}] [changePassword] Missing required fields`);
      res
        .status(400)
        .json({ message: "Current password and new password are required" });
      return;
    }

    // Get user with password field
    const user = await UserModel.findById(req.user._id).select("+password");
    if (!user) {
      console.log(
        `[${requestId}] [changePassword] User not found:`,
        req.user._id
      );
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log(
        `[${requestId}] [changePassword] Current password is incorrect`
      );
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log(
      `[${requestId}] [changePassword] Password updated successfully:`,
      req.user._id
    );
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(
      `[${requestId}] [changePassword] Error changing password:`,
      error
    );
    res.status(500).json({ message: "Error changing password" });
  }
};
