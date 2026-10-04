import { io } from "socket.io-client";

let socket;
export const getSocket = (connected, user) => {
  if (connected || !user) return;
  if (!socket) {
    socket = io(import.meta.env.VITE_BACKEND_HOST, {
      query: { userId: user },
      autoConnect: true,
    });
  }
  return socket;
};
