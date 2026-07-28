import { cookies } from "next/headers";

import { AuthService } from "@/server/services/auth-service";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days, matches SessionRepository

/**
 * Authoritative per-request auth check. Middleware only redirects on a
 * missing cookie (cheap presence check); this is the real DB-backed
 * validation, called at the top of every protected layout/page/action.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return AuthService.getUserForToken(token);
}

/**
 * Sets the session cookie in the response of a Server Action/route handler.
 * Always followed by a redirect (fresh request) rather than reading the
 * cookie in the same request — same-request cookie propagation is a known
 * rough edge on Workers (RFC 0001 "Key Risks / Gotchas").
 */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}
