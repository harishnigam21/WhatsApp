import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./DB/DBConnection";
import Auth from "./routes/Auth";
import Message from "./routes/Message";
import Users from "./routes/Users";
import Chat from "./routes/Chat";
import corsOptions from "./config/cors";
import { envList } from "./envConfig";
import { Server } from "socket.io";
import credentials from "./middlewares/credentials/credentials";
import cookieParser from "cookie-parser";
import User from "./models/User";
import jwt from "jsonwebtoken";
import MessageModel from "./models/Message";
import NotDelivered from "./models/NotDelivered";
import cloudinary from "./utils/cloudinary";
import type { Transport } from "engine.io";
connectDB();
const app = express();
app.use(cookieParser());
const server = http.createServer(app);
const PORT = envList.PORT || 5004;

//socket setup
export const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_HOST, credentials: true },
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 200 * 1024 * 1024,
});
//currently Online Users
export const userSocketIds = new Map<string, Set<string>>();

//verify user
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
    socket.data.userId = decoded.id;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

//socket logs
io.engine.on("connection", (conn) => {
  console.log("Transport connected:", conn.transport.name);

  conn.on("close", (reason: string) => {
    console.error("Engine connection closed:", reason);
  });

  conn.on("upgrade", (transport: Transport) => {
    console.log("Transport upgraded:", transport.name);
  });
});

//socket connection handler
io.on("connection", async (socket) => {
  const userId = socket.data.userId as string;
  if (!userId) return;
  console.log("User Connected", userId);
  if (!userSocketIds.has(userId)) {
    userSocketIds.set(userId, new Set());
  }
  userSocketIds.get(userId)!.add(socket.id);

  //on user become online, let we change the status of messages
  const notDeliveredMessages = await NotDelivered.find({
    receiver_id: userId,
  }).lean();
  if (notDeliveredMessages) {
    const messageIds = notDeliveredMessages.map((item) => item.message_id);
    await MessageModel.updateMany(
      {
        _id: { $in: messageIds },
      },
      {
        $set: {
          seen: "semiseen",
        },
      },
    );
    const structureMessage = notDeliveredMessages.reduce(
      (acc, item) => {
        const id = item.sender_id.toString();
        const message_id = item.message_id.toString();
        if (acc[id]) {
          acc[id] = [...acc[id], message_id];
        } else {
          acc[id] = [message_id];
        }
        return acc;
      },
      {} as Record<string, string[]>,
    );
    Object.entries(structureMessage).forEach(([sender_id, messageIds]) => {
      const socketExist = userSocketIds.get(sender_id);
      if (socketExist) {
        for (const socketId of socketExist) {
          io.to(socketId).emit("semiSeenDone", {
            messageIds,
            receiver_id: userId,
          });
        }
      }
    });
    await NotDelivered.deleteMany({ receiver_id: userId });
  }

  //emit online user to all connected users
  io.emit("getOnlineUsers", Array.from(userSocketIds.keys()));
  //TODO:later filter from their official contact list and send this event only to their contact
  io.emit("joinedUser", { userId });
  socket.on("saveUserInfo", async (data) => {
    console.log(data);
  });
  //sendMessage
  socket.on("sendMessage", async (data, acknowledge) => {
    try {
      const { sender_id, receiver_id, content } = data;
      if (sender_id !== userId) {
        return acknowledge?.({
          sendMessage: {
            success: false,
            message: "You are not valid user to send message",
          },
        });
      }
      const receiverSocket = userSocketIds.get(receiver_id);
      const message = await MessageModel.create({
        sender_id,
        receiver_id,
        content,
        seen: receiverSocket ? "semiseen" : "unseen",
      });
      if (!receiverSocket) {
        await NotDelivered.create({
          sender_id,
          receiver_id,
          message_id: message._id,
        });
      }
      const populateMessage = await message.populate([
        {
          path: "sender_id",
          select: "_id name pic lastSeen",
        },
        {
          path: "receiver_id",
          select: "_id name pic lastSeen",
        },
      ]);
      const messageData = {
        _id: message._id,
        sender_id: message.sender_id._id,
        receiver_id: message.receiver_id._id,
        content: message.content,
        seen: message.seen,
        createdAt: message.createdAt,
      };
      acknowledge?.({
        sendMessage: {
          success: true,
          messageData,
          extraData: {
            senderDetail: populateMessage.sender_id,
            receiverDetail: populateMessage.receiver_id,
          },
        },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("newMessage", {
            messageData,
            extraData: {
              senderDetail: populateMessage.sender_id,
              receiverDetail: populateMessage.receiver_id,
            },
          });
        }
      }
    } catch (error) {
      return acknowledge?.({
        sendMessage: { success: false, message: "Failed to send Message" },
      });
    }
  });
  // mark seen all``
  socket.on("seenAll", async (data, acknowledge) => {
    try {
      const { sender_id, receiver_id } = data;
      await MessageModel.updateMany(
        {
          sender_id: receiver_id,
          receiver_id: sender_id,
          seen: { $ne: "seen" },
        },
        { $set: { seen: "seen" } },
      );
      const receiverSocket = userSocketIds.get(receiver_id);

      acknowledge?.({
        seenAll: { success: true, allSeenOf: receiver_id },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("allSeen", {
            allSeenBy: sender_id,
          });
        }
      }
    } catch (error) {
      return acknowledge?.({
        seenAll: {
          success: false,
          message: "Failed to mark seen",
        },
      });
    }
  });
  // mark seen for one message
  socket.on("seen", async (data, acknowledge) => {
    try {
      const { sender_id, msg_id, receiver_id } = data;
      const message = await MessageModel.findOneAndUpdate(
        {
          _id: msg_id,
          sender_id,
          receiver_id,
        },
        { $set: { seen: "seen" } },
        { returnDocument: "after" },
      );
      const senderSocket = userSocketIds.get(sender_id);
      if (!message) throw new Error("No message found");
      acknowledge?.({
        seen: { msg_id, success: true },
      });
      if (senderSocket) {
        for (const socketId of senderSocket) {
          io.to(socketId).emit("seenDone", {
            msg_id: message._id,
            receiver_id: message?.receiver_id,
            lastSeen: message?.updatedAt,
          });
        }
      }
    } catch (error) {
      return acknowledge?.({
        seen: {
          success: false,
          message: "Failed to mark seen",
        },
      });
    }
  });
  //file upload
  socket.on("upload-file", async (file, acknowledge) => {
    try {
      const {
        sender_id,
        receiver_id,
        name,
        type,
        size,
        message,
        parent,
        buffer,
      } = file;
      if (sender_id !== userId) {
        return acknowledge?.({
          sendMessage: {
            success: false,
            message: "You are not valid user to send message",
          },
        });
      }
      if (
        !receiver_id ||
        !name ||
        typeof name !== "string" ||
        typeof type !== "string" ||
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > Number(process.env.ATTACHMENT_SIZE) ||
        !buffer
      ) {
        return acknowledge({
          success: false,
          message: "Invalid file or size. Maximum size is 10 MB.",
        });
      }
      const receiverSocket = userSocketIds.get(receiver_id);

      const fileBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

      if (fileBuffer.length !== size) {
        return acknowledge({ success: false, message: "File size mismatch" });
      }
      let existingMessage = null;
      if (parent) {
        existingMessage = await MessageModel.findOne({
          _id: parent,
          sender_id,
          receiver_id,
        });

        if (!existingMessage) {
          return acknowledge({
            success: false,
            message: "Parent message not found or unauthorized.",
          });
        }
      }

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `${process.env.ROOT}/messages/${sender_id}/${receiver_id}/attachments`,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("Upload failed"));
            resolve(result);
          },
        );

        stream.end(fileBuffer);
      });
      // Generate a thumbnail URL for image assets.
      const thumbnail =
        result.resource_type === "image"
          ? cloudinary.url(result.public_id, {
              secure: true,
              resource_type: "image",
              type: result.type,
              format: "jpg",
              transformation: [
                {
                  width: 300,
                  height: 300,
                  crop: "fill",
                  gravity: "auto",
                },
              ],
            })
          : null;
      const attachment = {
        url: result.secure_url,
        thumbnail,
        public_id: result.public_id,
        type,
        resource_type: result.resource_type,
        format: result.format,
        name,
        created_at: result.created_at,
        size: result.bytes,
        tags: result.tags,
        message,
      };
      let messageDoc;
      if (existingMessage) {
        messageDoc = await MessageModel.findOneAndUpdate(
          {
            _id: existingMessage._id,
            sender_id,
            receiver_id,
          },
          {
            $push: {
              attachments: attachment,
            },
            ...(receiverSocket && {
              $set: {
                seen: "semiseen",
              },
            }),
          },
          {
            returnDocument: "after",
          },
        );
        if (!messageDoc) {
          return acknowledge({
            success: false,
            message: "Could not update the parent message.",
          });
        }
      } else {
        messageDoc = await MessageModel.create({
          sender_id,
          receiver_id,
          content: message ?? "",
          attachments: [attachment],
          seen: receiverSocket ? "semiseen" : "unseen",
        });
      }
      if (!receiverSocket) {
        await NotDelivered.create({
          sender_id: messageDoc.sender_id,
          receiver_id: messageDoc.receiver_id,
          message_id: messageDoc._id,
        });
      }
      const populateMessage = await messageDoc.populate([
        {
          path: "sender_id",
          select: "_id name pic lastSeen",
        },
        {
          path: "receiver_id",
          select: "_id name pic lastSeen",
        },
      ]);
      const messageData = {
        _id: messageDoc._id,
        sender_id: messageDoc.sender_id._id,
        receiver_id: messageDoc.receiver_id._id,
        content: messageDoc.content,
        seen: messageDoc.seen,
        attachments: messageDoc.attachments,
        createdAt: messageDoc.createdAt,
      };
      acknowledge({
        success: true,
        messageData,
        extraData: {
          senderDetail: populateMessage.sender_id,
          receiverDetail: populateMessage.receiver_id,
        },
        parent: messageDoc._id.toString(),
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("newAttachment", {
            messageData,
            extraData: {
              senderDetail: populateMessage.sender_id,
              receiverDetail: populateMessage.receiver_id,
            },
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      return acknowledge({
        success: false,
        message: error.message || "Cloudinary upload failed",
      });
    }
  });
  //on disconnect
  socket.on("disconnect", () => {
    const newDate = new Date();
    const captureLast = async () => {
      await User.findByIdAndUpdate(userId, {
        $set: { lastSeen: newDate },
      });
    };
    captureLast();
    console.log("User DisConnected", userId);
    io.emit("getOfflineUser", { userId, lastSeen: newDate });
    userSocketIds.delete(userId);
    io.emit("getOnlineUsers", Array.from(userSocketIds.keys()));
  });
});

//middleware's
app.use(credentials);
app.use(cors(corsOptions));
//currently not using this, switched to multer
// app.use(express.json({ limit: "50mb" }));
app.use(express.json());
// app.use(express.urlencoded({ limit: "50mb", extended: true }));
//routes
app.use("/api/auth", Auth);
app.use("/api/message", Message);
app.use("/api/users", Users);
app.use("/api/chat", Chat);

app.get("/", (req, res) =>
  res.status(200).json({ message: "Backend Server running successfully" }),
);
server.listen(PORT, () =>
  console.log(`Backend Server is running at PORT No.-->> ${PORT}`),
);
export default server;
