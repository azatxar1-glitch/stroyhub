import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const CUSTOMER_ONLY = ["/jobs/new", "/dashboard/jobs"];
const EXECUTOR_ONLY = ["/dashboard/proposals", "/dashboard/portfolio"];
const ADMIN_ONLY = ["/admin"];
const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/messages", "/admin", "/jobs/new"];

/**
 * Адрес, на котором нас реально открыли.
 *
 * Брать req.nextUrl.origin здесь нельзя: next-auth (reqWithEnvURL) подменяет
 * origin запроса значением AUTH_URL ещё до того, как выполнится этот код.
 * Стоит переменной устареть — и незалогиненный посетитель, нажав «Создать
 * заявку», уезжает редиректом на чужой домен. Заголовки от прокси такого
 * не допускают: они описывают текущий запрос, а не конфигурацию.
 */
function requestOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return req.nextUrl.origin;

  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const origin = requestOrigin(req);

  const requiresAuth = AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));

  if (requiresAuth && !isLoggedIn) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", origin));
  }

  // Роль не та — но человек залогинен, и выкидывать его на главную значит
  // терять контекст. Возвращаем в кабинет: там показан набор разделов,
  // который ему действительно доступен.
  const wrongRole =
    (CUSTOMER_ONLY.some((p) => pathname.startsWith(p)) && role !== "CUSTOMER") ||
    (EXECUTOR_ONLY.some((p) => pathname.startsWith(p)) && role !== "EXECUTOR");

  if (isLoggedIn && wrongRole) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/messages/:path*", "/admin/:path*", "/jobs/new"],
};
