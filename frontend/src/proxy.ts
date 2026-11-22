import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sections = ["dashboard", "workspace", "approval", "team", "settings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("gridflow_token")?.value;
  const slug = request.cookies.get("gridflow_tenant")?.value;
  const signedIn = Boolean(token && slug);

  if (pathname === "/") {
    const target = signedIn ? `/${slug}/dashboard` : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === "/login" || pathname === "/register") {
    if (signedIn) return NextResponse.redirect(new URL(`/${slug}/dashboard`, request.url));
    return NextResponse.next();
  }

  if (!signedIn) return NextResponse.redirect(new URL("/login", request.url));

  const [, urlSlug, section] = pathname.split("/");
  if (!section || !sections.includes(section)) {
    return NextResponse.redirect(new URL(`/${slug}/dashboard`, request.url));
  }
  if (urlSlug !== slug) {
    return NextResponse.redirect(new URL(`/${slug}/${section}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mock/|.*\\..*).*)"],
};
