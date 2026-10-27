import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function verifyUser(io: Server) {
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const cookies = Object.fromEntries(
        cookieHeader
          .split(";")
          .filter(Boolean)
          .map((item) => {
            const index = item.indexOf("=");

            if (index === -1) {
              return [item.trim(), ""];
            }

            return [
              item.slice(0, index).trim(),
              decodeURIComponent(item.slice(index + 1).trim()),
            ];
          }),
      );
      const token = cookies.actk;
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_KEY as string,
      ) as {
        id: string;
      };
      if (typeof decoded === "string" || !decoded.id) {
        return next(new Error("Invalid token"));
      }
      console.log("Verified by Socket");
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });
}
