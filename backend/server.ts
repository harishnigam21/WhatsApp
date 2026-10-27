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
import { registerFileUploadHandlers } from "./socket/handlers/fileUpload";
import { sendMessage } from "./socket/handlers/sendMessage";
import { seenAll } from "./socket/handlers/seenAll";
import { markSeen } from "./socket/handlers/markSeen";
import { onOnlineChangeStatus } from "./socket/services/onOnlineChangeStatus";
import { socketLogs } from "./socket/services/socketLogs";
import { verifyUser } from "./socket/services/verifyUser";
connectDB();
const app = express();
app.use(cookieParser());
const server = http.createServer(app);
const PORT = envList.PORT || 5004;

//socket setup
export const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_HOST, credentials: true },
  pingInterval: 25000,
  pingTimeout: 120000,
  maxHttpBufferSize: 200 * 1024 * 1024,
});
//currently Online Users
export const userSocketIds = new Map<string, Set<string>>();

//verify user
verifyUser(io);

//socket logs
socketLogs(io);

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
  await onOnlineChangeStatus(userId, io);

  //emit online user to all connected users
  io.emit("getOnlineUsers", Array.from(userSocketIds.keys()));
  //TODO:later filter from their official contact list and send this event only to their contact
  io.emit("joinedUser", { userId });
  //sendMessage
  sendMessage(io, socket);
  // mark seen all``
  seenAll(io, socket);
  // mark seen for one message
  markSeen(io, socket);
  //file upload
  registerFileUploadHandlers(io, socket);
  //on disconnect
  socket.on("disconnect", (reason) => {
    const newDate = new Date();
    const captureLast = async () => {
      await User.findByIdAndUpdate(userId, {
        $set: { lastSeen: newDate },
      });
    };
    captureLast();
    console.error("User Disconnected", {
      userId: userId,
      reason,
      time: new Date().toISOString(),
    });
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
