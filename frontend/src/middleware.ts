import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const in_production = process.env.NEXT_PUBLIC_IN_PRODUCTION === "true";
export async function middleware(request: NextRequest) {
  const actk = request.cookies.get("actk")?.value;
  const jwt = request.cookies.get("jwt")?.value;

  let response = NextResponse.next();

  if (!actk && jwt) {
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
          httpOnly: true,
          maxAge: 24 * 60 * 60, // maxAge in middleware is in SECONDS, not milliseconds
          secure: in_production,
          sameSite: (in_production ? "none" : "lax") as "none" | "lax",
          domain: process.env.TOP_DOMAIN,
          path: "/",
        };

        response.cookies.set("actk", refreshData.actk, cookieOptions);
        request.cookies.set("actk", refreshData.actk);

        response = NextResponse.next({
          request: {
            headers: request.headers,
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
// Ensure this runs on your page routes, but skips static files/images
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
