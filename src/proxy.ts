import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const CUSTOMER_ONLY = ["/jobs/new"];
const EXECUTOR_ONLY = ["/dashboard/proposals", "/dashboard/portfolio"];
const ADMIN_ONLY = ["/admin"];
const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/messages", "/admin", "/jobs/new"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const requiresAuth = AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));

  if (requiresAuth && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (isLoggedIn && CUSTOMER_ONLY.some((p) => pathname.startsWith(p)) && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (isLoggedIn && EXECUTOR_ONLY.some((p) => pathname.startsWith(p)) && role !== "EXECUTOR") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/messages/:path*", "/admin/:path*", "/jobs/new"],
};
