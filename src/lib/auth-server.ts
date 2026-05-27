import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { prisma } from "./db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || "ourfund-default-secret-key-12345";
const COOKIE_NAME = "ourfund_session";

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export interface SessionData {
  userId: string;
}

export function parseCookies(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const parts = c.split("=");
      return [parts[0].trim(), parts.slice(1).join("=").trim()];
    })
  );
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
  const cookieValue = `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
  setResponseHeader("Set-Cookie", cookieValue);
}

export function clearSessionCookie() {
  const cookieValue = `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  setResponseHeader("Set-Cookie", cookieValue);
}

export async function getSessionUser() {
  const cookieHeader = getRequestHeader("Cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];

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
