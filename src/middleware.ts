import { NextResponse, type NextRequest } from "next/server";

// Redirect unauthenticated users to /login. The session cookie's authenticity
// is verified at the data layer (HMAC); this is the UX gate. Public paths:
// the landing page, /login, and /api (the WhatsApp webhook has no cookie).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  if (!req.cookies.get("kf_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
