import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import GoogleStrategy from "passport-google-oidc";
import { Strategy as FacebookStrategy } from "passport-facebook";

/**
 * Configure Local Strategy (Username & Password)
 */
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          return done(null, false, { message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password." });
        }

        const { password: _password, ...safeUser } = user;
        return done(null, safeUser);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

/**
 * Configure Google Strategy, only if credentials are actually configured.
 */
export const GOOGLE_OAUTH_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

if (GOOGLE_OAUTH_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "http://localhost:3000/api/auth/oauth2/redirect/google",
        scope: ["profile", "email"],
      },
      async (
        issuer: string,
        profile: any,
        cb: (err: any, user?: any, info?: any) => void,
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || "User";

          let user = await prisma.user.findUnique({ where: { googleId } });

          if (!user && email) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId },
              });
            }
          }

          if (!user) {
            let username = displayName;
            let suffix = 0;
            while (await prisma.user.findUnique({ where: { username } })) {
              suffix++;
              username = `${displayName}${suffix}`;
            }

            user = await prisma.user.create({
              data: {
                googleId,
                email: email ?? `${googleId}@google.oauth`,
                username,
              },
            });
          }

          return cb(null, user);
        } catch (err) {
          return cb(err);
        }
      },
    ),
  );
} else {
  console.warn(
    "[auth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set — Google login disabled.",
  );
}

/**
 * Configure Facebook Strategy, only if credentials are actually configured.
 */
export const FACEBOOK_OAUTH_ENABLED = Boolean(
  process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET,
);

if (FACEBOOK_OAUTH_ENABLED) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID!,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
        callbackURL: "http://localhost:3000/api/auth/oauth2/redirect/facebook",
        profileFields: ["id", "displayName", "emails"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        cb: (err: any, user?: any, info?: any) => void,
      ) => {
        try {
          const facebookId = profile.id;
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || "User";

          let user = await prisma.user.findUnique({ where: { facebookId } });

          if (!user && email) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { facebookId },
              });
            }
          }

          if (!user) {
            let username = displayName;
            let suffix = 0;
            while (await prisma.user.findUnique({ where: { username } })) {
              suffix++;
              username = `${displayName}${suffix}`;
            }

            user = await prisma.user.create({
              data: {
                facebookId,
                email: email ?? `${facebookId}@facebook.oauth`,
                username,
              },
            });
          }

          return cb(null, user);
        } catch (err) {
          return cb(err);
        }
      },
    ),
  );
} else {
  console.warn(
    "[auth] FACEBOOK_APP_ID/FACEBOOK_APP_SECRET not set — Facebook login disabled.",
  );
}

/**
 * Configure Passport Session Management
 */
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarColor: true,
        lastOnline: true,
        createdAt: true,
        googleId: true,
        facebookId: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;