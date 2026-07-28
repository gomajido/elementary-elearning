import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/admin", "/teacher", "/student", "/parent"];

/**
 * Cheap cookie-presence redirect only — the authoritative, D1-backed
 * session/role check happens in getCurrentUser()/requireRole() inside each
 * protected layout. Two-layer design avoids depending on Edge-incompatible
 * DB access inside middleware itself. See RFC 0001 "Auth Design".
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*", "/parent/:path*"],
};
