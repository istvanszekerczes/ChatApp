import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

// Configure Local Strategy (Username & Password)
passport.use(
  new LocalStrategy(
    { usernameField: 'email' }, 
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        const { password: _password, ...safeUser } = user;
        return done(null, safeUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Save user id in session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Retrieve user from database using the session id
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, username: true, avatarColor: true,
        lastOnline: true, createdAt: true, googleId: true, facebookId: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;