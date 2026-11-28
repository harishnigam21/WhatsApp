import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_HOST!;

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("actk")?.value;

    const publicRoutes = [
      "auth",
      "sync-session",
      "abort-sync-session",
      "import-sync-session",
    ];
    const isPublicRoute =
      path[0] === "api" &&
      (publicRoutes.includes(path[1]) || publicRoutes.includes(path[2]));
    if (!accessToken && !isPublicRoute) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const targetUrl = new URL(
      `/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
      BACKEND_URL,
    );

    const headers = new Headers();

    headers.set("Authorization", `Bearer ${accessToken}`);

    const contentType = req.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await req.arrayBuffer()
          : undefined,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const contentTypeRes = response.headers.get("Content-Type");
    if (contentTypeRes) {
      responseHeaders.set("Content-Type", contentTypeRes);
    }
    // Forward all cookies from backend
    const cookiesRes = response.headers.getSetCookie();
    cookiesRes.forEach((cookie) => {
      responseHeaders.append("Set-Cookie", cookie);
    });
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
