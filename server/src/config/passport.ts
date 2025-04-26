import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import UserModel, { IUser } from "../models/UserModel";

// Configure Passport.js
export default function configurePassport() {
  // Local Strategy for email/password login
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Find the user by email and explicitly select the password field
          const user = await UserModel.findOne({ email }).select("+password");

          // User not found
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Verify password
          const isMatch = await user.comparePassword(password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Return user without password
          const userObject = user.toObject();
          delete (userObject as { password?: string }).password;
          return done(null, userObject);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // JWT Strategy for token authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || "your-secret-key",
      },
      async (jwtPayload, done) => {
        try {
          const user = await UserModel.findById(jwtPayload.id);

          if (user) {
            return done(null, user);
          }

          return done(null, false);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
