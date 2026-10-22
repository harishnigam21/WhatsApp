import axios from "axios";
export const eAxios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
