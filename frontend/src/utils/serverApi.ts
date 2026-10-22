import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function serverFetch<T>(
  url: string,
  method?: string,
  body?: unknown,
  customHeaders?: Record<string, string>,
): Promise<{ success: boolean; data: T | null; status: number }> {
  const in_production = process.env.NEXT_PUBLIC_IN_PRODUCTION === "true";
  const cookieStore = await cookies();
  const token = cookieStore.get("actk")?.value || "";
  const jwt = cookieStore.get("jwt")?.value || null;
  const headers = new Headers(customHeaders);
  const nextResponse = NextResponse.next();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  let response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST}/${url}`, {
    method,
    headers,
    credentials: "include",
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  });
  const modResponse = await response.json();
  if (response.ok) {
    return { success: true, data: modResponse, status: response.status };
  }
  if (!jwt && modResponse.issue && modResponse.issue == "not verified") {
    redirect("/login");
  }

  if (!response.ok) {
    return { success: false, data: null, status: response.status };
  }
  const data = await response.json();
  return { success: true, data, status: response.status };
}
