import { Middleware } from "@reduxjs/toolkit";
import { io, Socket } from "socket.io-client";
import { setConnectionStatus } from "./slices/SocketSlice";
import {
  addReceiverMessage,
  addSenderMessage,
  clearUnread,
  markAllSeen,
  markSeen,
  markSemiSeen,
  markUserOffline,
  markUserOnline,
  MessageType,
} from "./slices/ChatSlice";
import toast from "react-hot-toast";

export let socket: Socket | null = null;

export const socketMiddleware: Middleware =
  (store) => (next) => (action: any) => {
    if (action.type === "socket/connect") {
      const userId = action.payload;
      if (!socket && userId) {
        socket = io(process.env.NEXT_PUBLIC_BACKEND_HOST, {
          withCredentials: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        socket.on("connect", () => {
          store.dispatch(setConnectionStatus(true));
        });
        socket.on(
          "newMessage",
          (data: {
            messageData: MessageType;
            extraData?: {
              senderDetail: {
                _id: string;
                name: string;
                pic: string;
                lastSeen: Date;
              };
              receiverDetail: {
                _id: string;
                name: string;
                pic: string;
                lastSeen: Date;
              };
            };
          }) => {
            store.dispatch(
              addReceiverMessage({
                data: data.messageData!,
                extra: data.extraData!,
              }),
            );
          },
        );
        socket.on(
          "newAttachment",
          (data: {
            messageData: MessageType;
            extraData?: {
              senderDetail: {
                _id: string;
                name: string;
                pic: string;
                lastSeen: Date;
              };
              receiverDetail: {
                _id: string;
                name: string;
                pic: string;
                lastSeen: Date;
              };
            };
          }) => {
            store.dispatch(
              addReceiverMessage({
                data: data.messageData!,
                extra: data.extraData!,
              }),
            );
          },
        );
        socket.on("allSeen", (data) => {
          const { allSeenBy } = data;
          if (!allSeenBy) return;
          store.dispatch(markAllSeen(allSeenBy));
        });
        socket.on("seenDone", (data) => {
          const { msg_id, receiver_id, lastSeen } = data;
          store.dispatch(markSeen({ msg_id, receiver_id, lastSeen }));
        });
        socket.on("semiSeenDone", (data) => {
          const { messageIds, receiver_id } = data;
          store.dispatch(markSemiSeen({ messageIds, receiver_id }));
        });
        socket.on("getOfflineUser", (data) => {
          const { userId, lastSeen } = data;
          if (userId && lastSeen) {
            store.dispatch(markUserOffline({ userId, lastSeen }));
          }
        });
        socket.on("joinedUser", (data) => {
          const { userId } = data;
          if (userId) {
            store.dispatch(markUserOnline(userId));
          }
        });
        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
        });
        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          store.dispatch(setConnectionStatus(false));
        });
      }
    }

    //Request via socket
    if (action.type === "socket/sendSocketRequest") {
      if (!socket?.connected) {
        console.log("Socket is not connected");
        return;
      }
      const { event, data } = action.payload;
      type SocketResponse = {
        sendMessage?: {
          success: boolean;
          message?: string;
          messageData?: MessageType;
          extraData?: {
            senderDetail: {
              _id: string;
              name: string;
              pic: string;
              lastSeen: Date;
            };
            receiverDetail: {
              _id: string;
              name: string;
              pic: string;
              lastSeen: Date;
            };
          };
        };
        seenAll?: {
          success: boolean;
          allSeenOf?: string;
        };
      };
      socket.emit(event, data, (response: SocketResponse) => {
        switch (event) {
          case "sendMessage": {
            const eventResponse = response.sendMessage;
            if (!eventResponse) return;
            if (eventResponse.success) {
              store.dispatch(
                addSenderMessage({
                  data: eventResponse.messageData!,
                  extra: eventResponse.extraData!,
                }),
              );
            } else {
              toast.error(eventResponse.message!);
            }
            break;
          }
          case "seenAll": {
            console.log("Sending request for seenAll");
            const eventResponse = response.seenAll;
            if (!eventResponse) return;
            if (eventResponse.success && eventResponse.allSeenOf) {
              store.dispatch(clearUnread(eventResponse.allSeenOf));
            }
            break;
          }

          default:
            break;
        }
      });
      return;
    }

    // DISCONNECT
    if (action.type === "socket/disconnect" && socket) {
      socket.disconnect();
      socket = null;
    }

    return next(action);
  };
