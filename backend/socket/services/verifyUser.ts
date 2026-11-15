import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import redisConnect from "../../config/redis_connect";
import User from "../../models/User";

export function verifyUser(io: Server) {
  io.use(async (socket, next) => {
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
      const getUser = await redisConnect.get(`WhatsAppUserInfo-${decoded.id}`);
      if (!getUser) {
        const UserExist = await User.findById(decoded.id).lean();
        if (!UserExist) {
          console.error("2.2 User no longer exists");
          return next(new Error("Unauthorized"));
        }
        const eUser = {
          _id: UserExist._id.toString(),
          name: UserExist.name,
          email: UserExist.email,
          phone: UserExist.phone,
          phoneCode: UserExist.phoneCode,
          pic: UserExist?.pic || null,
          banner: UserExist?.banner || null,
          bio: UserExist.bio,
          lastSeen: UserExist.lastSeen,
        };
        await redisConnect.set(
          `WhatsAppUserInfo-${eUser._id}`,
          JSON.stringify(eUser),
          "EX",
          7 * 24 * 60 * 60,
        );
      }
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });
}
