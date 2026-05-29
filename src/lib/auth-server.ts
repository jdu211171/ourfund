import { OAuth2Client } from "google-auth-library";
import {
  clearSession as clearStartSession,
  deleteCookie,
  getRequestHeader,
  getSession,
  updateSession,
} from "@tanstack/react-start/server";
import type { SessionConfig } from "@tanstack/react-start/server";
import { prisma } from "./db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const SESSION_NAME = "ourfund_app_session";
const LEGACY_COOKIE_NAME = "ourfund_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "ourfund-default-session-secret-key-123456";
const SESSION_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export interface SessionData {
  userId?: string;
}

function isLocalHost(host: string) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);
}

function shouldUseSecureCookie() {
  const override = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  const forwardedProto = getRequestHeader("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = getRequestHeader("host") ?? "";

  if (forwardedProto === "https") return true;
  if (isLocalHost(host)) return false;

  return process.env.NODE_ENV === "production";
}

function getSessionConfig(): SessionConfig {
  return {
    name: SESSION_NAME,
    password: SESSION_SECRET,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: shouldUseSecureCookie(),
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function verifyGoogleToken(idToken: string) {
  if (!googleClient) {
    throw new Error("Google Client ID is not configured on the server");
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Invalid Google token payload");
  }
  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name || "Google User",
    picture: payload.picture,
  };
}

export async function createSession(userId: string) {
  await updateSession<SessionData>(getSessionConfig(), { userId });
  deleteCookie(LEGACY_COOKIE_NAME, {
    path: "/",
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
  });
}

export async function clearSession() {
  await clearStartSession(getSessionConfig());
  deleteCookie(LEGACY_COOKIE_NAME, {
    path: "/",
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
  });
}

export async function getSessionUser() {
  const session = await getSession<SessionData>(getSessionConfig());
  const userId = session.data.userId;

  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        householdMembers: {
          include: {
            household: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error("Session user lookup failed:", error);
    return null;
  }
}
