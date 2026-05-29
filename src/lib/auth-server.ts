import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { prisma } from "./db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || "ourfund-default-secret-key-12345";
const COOKIE_NAME = "ourfund_session";

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export interface SessionData {
  userId: string;
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
  const maxAge = 90 * 24 * 60 * 60; // 90 days in seconds
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return token;
}

export function clearSessionCookie() {
  deleteCookie(COOKIE_NAME, {
    path: "/",
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
  });
}

function getBearerToken() {
  const authorization = getRequestHeader("authorization");
  if (!authorization) return null;

  const [scheme, token] = authorization.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function getSessionUser() {
  const token = getCookie(COOKIE_NAME) ?? getBearerToken();

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
