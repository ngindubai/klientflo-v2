import { NextResponse } from "next/server";

// Demo access gate REMOVED: the live link is intentionally open with no
// password. Every request is allowed through regardless of session/env.
//
// The /login page and the auth route (src/server/auth.ts) are deliberately
// left in place but unreachable from this middleware, so the password gate can
// be restored later by reinstating the redirect-to-/login logic below.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
