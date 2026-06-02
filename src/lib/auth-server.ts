import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import {
  deleteCookie,
  getCookie,
  getRequestHost,
  getRequestProtocol,
  setCookie,
} from "@tanstack/react-start/server";
import { prisma } from "./db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || "ourfund-default-secret-key-12345";
const COOKIE_NAME = "ourfund_session";
const SESSION_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export interface SessionData {
  userId: string;
}

function getSessionCookieOptions(maxAge?: number) {
  const trustProxy = process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production";
  const protocol = getRequestProtocol({ xForwardedProto: trustProxy });
  const host = getRequestHost({ xForwardedHost: trustProxy });
  const secureEnv = process.env.COOKIE_SECURE?.trim().toLowerCase();
  const secure =
    secureEnv === "true"
      ? true
      : secureEnv === "false"
        ? false
        : protocol === "https" && !host.startsWith("127.0.0.1");
  const sameSiteEnv = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  const domain = process.env.COOKIE_DOMAIN?.trim();
  let sameSite: "lax" | "strict" | "none" = "lax";

  if (sameSiteEnv === "strict") sameSite = "strict";
  if (sameSiteEnv === "none") sameSite = secure ? "none" : "lax";
  if (sameSiteEnv === "lax") sameSite = "lax";

  return {
    httpOnly: true,
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
    path: "/",
    maxAge,
    ...(maxAge ? { expires: new Date(Date.now() + maxAge * 1000) } : {}),
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

export function createSessionCookie(userId: string) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "90d" });
  setCookie(COOKIE_NAME, token, getSessionCookieOptions(SESSION_MAX_AGE));
}

export function clearSessionCookie() {
  deleteCookie(COOKIE_NAME, getSessionCookieOptions());
}

export async function getSessionUser() {
  const token = getCookie(COOKIE_NAME);

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    if (!decoded || !decoded.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
    console.error("JWT Session verification failed:", error);
    return null;
  }
}
