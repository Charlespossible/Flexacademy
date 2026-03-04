import { PassportStatic } from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { prisma } from "./database";
import { JwtPayload } from "../types";

export const configurePassport = (passport: PassportStatic): void => {
  // ─── JWT Strategy ──────────────────────────
  const jwtOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET ?? "",
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!user || !user.isActive) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  // ─── Google OAuth Strategy ─────────────────
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "",
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"), false);

          let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

          if (!user) {
            user = await prisma.user.upsert({
              where: { email },
              update: { googleId: profile.id },
              create: {
                email,
                googleId: profile.id,
                firstName: profile.name?.givenName ?? "",
                lastName: profile.name?.familyName ?? "",
                avatar: profile.photos?.[0]?.value,
                isEmailVerified: true,
                studentProfile: {
                  create: { gradeLevel: "SS3", curriculum: "WAEC" },
                },
                subscription: {
                  create: { tier: "FREE", status: "ACTIVE" },
                },
              },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
};
