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

    if (!accessToken) {
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

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
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
