import { Server } from "socket.io";
import type { Transport } from "engine.io";

export function socketLogs(io: Server) {
  io.engine.on("connection", (conn) => {
    console.log("Transport connected:", conn.transport.name);

    conn.on("close", (reason: string) => {
      console.error("Engine connection closed:", reason);
    });

    conn.on("upgrade", (transport: Transport) => {
      console.log("Transport upgraded:", transport.name);
    });
  });
}
