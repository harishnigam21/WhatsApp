import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
const in_production = process.env.NEXT_PUBLIC_IN_PRODUCTION === "true";
export async function middleware(request: NextRequest) {
  const actk = request.cookies.get("actk")?.value;
  const jwt = request.cookies.get("jwt")?.value;

  let response = NextResponse.next();

  if (!(await isAccessTokenValid(actk)) && jwt) {
    try {
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/auth/refresh`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `jwt=${jwt}`,
          },
          method: "GET",
          cache: "no-store",
        },
      );
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();

        const cookieOptions = {
          httpOnly: in_production,
          maxAge: 24 * 60 * 60, // maxAge in middleware is in SECONDS, not milliseconds
          secure: in_production,
          sameSite: (in_production ? "none" : "lax") as "none" | "lax",
          domain: process.env.NEXT_PUBLIC_TOP_DOMAIN,
          path: "/",
        };
        request.cookies.set("actk", refreshData.actk);

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("Cookie", request.cookies.toString());

        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        response.cookies.set("actk", refreshData.actk, cookieOptions);
      } else {
        const redirectResponse = NextResponse.redirect(
          new URL("/login", request.url),
        );
        return clearAuthCookies(redirectResponse);
      }
    } catch (error) {
      console.error("Middleware refresh failed:", error);
      const redirectResponse = NextResponse.redirect(
        new URL("/login", request.url),
      );
      return clearAuthCookies(redirectResponse);
    }
  }

  return response;
}
const clearAuthCookies = (response: NextResponse) => {
  const options = {
    httpOnly: in_production,
    secure: in_production,
    sameSite: in_production ? ("none" as const) : ("lax" as const),
    domain: process.env.NEXT_PUBLIC_TOP_DOMAIN || undefined,
    path: "/",
    expires: new Date(0),
  };

  response.cookies.set("actk", "", options);
  response.cookies.set("jwt", "", options);

  return response;
};
const isAccessTokenValid = async (token?: string) => {
  if (!token) return false;

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.ACCESS_TOKEN_KEY!),
    );

    return true;
  } catch {
    return false;
  }
};
// Ensure this runs on your page routes, but skips static files/images
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
