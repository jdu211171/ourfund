import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  getSessionUser,
  createSessionCookie,
  createSessionCookie as createSessionCookieImport,
  clearSessionCookie,
  verifyGoogleToken,
} from "@/lib/auth-server";
import { getAppBaseUrl, sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/mailer";

export const loginWithEmailServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; passwordHash: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const { passwordHash: password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password");
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new Error("Invalid email or password");
    }
    createSessionCookie(user.id);
    return { success: true };
  });

export const signUpWithEmailServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; name: string; passwordHash: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const { passwordHash: password } = data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      throw new Error("Email already registered");
    }
    const hash = await bcrypt.hash(password, 10);
    const initials =
      name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "YO";

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            passwordHash: hash,
            initials: initials || existing.initials,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name,
            passwordHash: hash,
            initials,
          },
        });
    createSessionCookie(user.id);
    if (!existing)
      await prisma.appNotification.create({
        data: {
          userId: user.id,
          title: "Welcome to Nest",
          desc: "Your account is ready. Start your first household whenever you’re ready.",
          time: "now",
          group: "Today",
          tone: "primary",
          screen: "home",
        },
      });
    if (!existing) await sendWelcomeEmail({ to: user.email, name: user.name });
    return { success: true };
  });

export const loginWithGoogleServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { credential: string }) => d)
  .handler(async ({ data }) => {
    const { credential } = data;
    const googleProfile = await verifyGoogleToken(credential);
    let user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (!user) {
      throw new Error("No account found for this Google email. Create an account first.");
    } else if (!user.googleId) {
      // Link Google ID if they signed up with password previously
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleProfile.googleId },
      });
    }

    createSessionCookie(user.id);
    return { success: true };
  });

export const checkEmailRegisteredServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email) return { registered: false, hasPassword: false };
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
    return { registered: Boolean(user), hasPassword: Boolean(user?.passwordHash) };
  });

export const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { success: true };
});

export const requestPasswordResetServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; inviteCode?: string; invitedEmail?: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email) throw new Error("Email is required");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      },
    });

    const resetParams = new URLSearchParams({ reset: token });
    if (data.inviteCode) resetParams.set("invite", data.inviteCode);
    if (data.invitedEmail) resetParams.set("email", data.invitedEmail.trim().toLowerCase());
    const resetUrl = `${getAppBaseUrl()}/?${resetParams.toString()}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    await prisma.appNotification.create({
      data: {
        userId: user.id,
        title: "Password reset requested",
        desc: "We emailed you a secure link to reset your password.",
        time: "now",
        group: "Today",
        tone: "primary",
        screen: "settings",
      },
    });

    return { success: true };
  });

export const resetPasswordServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; password: string }) => d)
  .handler(async ({ data }) => {
    const token = data.token.trim();
    const password = data.password.trim();
    if (!token) throw new Error("Reset token is required");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) throw new Error("Reset link is invalid or has expired");

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    await prisma.appNotification.create({
      data: {
        userId: user.id,
        title: "Password updated",
        desc: "Your password was updated successfully.",
        time: "now",
        group: "Today",
        tone: "success",
        screen: "settings",
      },
    });

    return { success: true };
  });
