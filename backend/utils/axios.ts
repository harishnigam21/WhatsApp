import axios from "axios";
export const eAxios = axios.create({
  baseURL: `${process.env.BACKEND_HOST}`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
