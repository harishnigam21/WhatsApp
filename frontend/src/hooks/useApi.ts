"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/Store";
import { setLoginStatus, setUser } from "@/redux/slices/UserSlice";

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  status: number;
  error?: string;
};
export type RequestFn<T = unknown> = (
  url: string,
  method?: string,
  body?: unknown,
  customHeaders?: Record<string, string>,
  redirect?: boolean,
  retry?: boolean,
) => Promise<ApiResponse<T>>;

const useApi = <T = unknown>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleGlobalStatus = useCallback(
    (statusCode: number) => {
      if (statusCode === 401) {
        localStorage.removeItem("actk");
        dispatch(setLoginStatus("unauthenticated"));
        router.push("/login");
      }
    },
    [router, dispatch],
  );

  const sendRequest = useCallback(
    async (
      url: string,
      method: string = "GET",
      body: unknown = null,
      customHeaders: Record<string, string> = {},
      redirect: boolean = true,
      retry: boolean = true, // prevent infinite loop
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      setStatus(null);

      const updateUrl = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/${url}`;

      const makeRequest = async () => {
        const headers: Record<string, string> = {
          Authorization: localStorage.getItem("actk")
            ? `Bearer ${localStorage.getItem("actk")}`
            : "",
          ...customHeaders,
        };

        if (!(body instanceof FormData)) {
          headers["Content-Type"] = "application/json";
        }

        return fetch(updateUrl, {
          method,
          headers,
          credentials: "include",
          body:
            body instanceof FormData
              ? body
              : body
                ? JSON.stringify(body)
                : null,
        });
      };

      try {
        const response = await makeRequest();
        setStatus(response.status);
        const modResponse = await response.json();
        if (modResponse.issue && modResponse.issue == "not verified") {
          router.push("/login");
        }
        if (
          response.status === 401 &&
          modResponse.issue == "token expired" &&
          retry
        ) {
          try {
            const refreshRes = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/refresh`,
              {
                method: "GET",
                credentials: "include",
              },
            );

            if (!refreshRes.ok) throw new Error("Refresh failed");

            const refreshData = await refreshRes.json();
            localStorage.setItem("actk", refreshData.actk);
            dispatch(setUser(refreshData.data));
            dispatch(setLoginStatus("authenticated"));
            return await sendRequest(
              url,
              method,
              body,
              customHeaders,
              redirect,
              false,
            );
          } catch (err) {
            console.error(err);
            localStorage.removeItem("actk");
            dispatch(setLoginStatus("unauthenticated"));
            router.push("/login");

            return {
              success: false,
              data: null,
              status: 403,
              error: "Session expired",
            };
          }
        }

        if (redirect) handleGlobalStatus(response.status);

        if (!response.ok) {
          return {
            success: false,
            data: modResponse,
            status: response.status,
            error: modResponse.message || "Request failed",
          };
        }

        setData(modResponse);

        return {
          success: true,
          data: modResponse,
          status: response.status,
        };
      } catch (err: unknown) {
        const internalErrorStatus = 500;
        setStatus(internalErrorStatus);

        let errorMessage = "Unexpected error";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        if (redirect) {
          handleGlobalStatus(internalErrorStatus);
        }

        return {
          success: false,
          data: null,
          error: errorMessage,
          status: internalErrorStatus,
        };
      } finally {
        setLoading(false);
      }
    },
    [handleGlobalStatus, dispatch, router],
  );

  return { data, loading, error, status, sendRequest };
};

export default useApi;
