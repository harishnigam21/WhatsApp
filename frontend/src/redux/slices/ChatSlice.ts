import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface AttachmentType {
  _id: string;
  url: string;
  thumbnail: string | null;
  public_id: string;
  resource_type: string;
  type: string;
  name: string;
  createdAt: Date;
  size: number;
  tags: string[];
  message: string;
}
export interface MessageType {
  _id: string;
  receiver_id: string;
  sender_id: string;
  content: string;
  attachments?: AttachmentType[];
  seen: "seen" | "unseen" | "semiseen";
  starred: boolean;
  deletedFor?: boolean;
  inTrash?: boolean;
  deletedForEveryone?: boolean;
  createdAt: Date;
}
export interface Contact {
  _id: string;
  name: string;
  pic: string;
  bio: string;
}
export interface ActiveContact {
  _id: string;
  name: string;
  pic: string;
  lastSeen: Date;
  lastMessage: MessageType;
  unread: number;
}
export interface selectedContactType {
  _id: string;
  name: string;
  pic: string;
  lastSeen: Date;
  messages: MessageType[];
  status: boolean;
}
interface initialStateType {
  selectedContact: selectedContactType | null;
  selectedContactLoading: boolean;
  Contacts: Contact[];
  activeContacts: ActiveContact[];
  cachedUrls: Record<string, string>;
  selectedFor: boolean;
  selectionFor: string[];
}
const initialState: initialStateType = {
  selectedContact: null,
  selectedContactLoading: false,
  Contacts: [],
  activeContacts: [],
  cachedUrls: {},
  selectedFor: false,
  selectionFor: [],
};
const ChatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<selectedContactType>) => {
      state.selectedContact = action.payload;
    },
    setSelectedContactLoading: (state, action: PayloadAction<boolean>) => {
      state.selectedContactLoading = action.payload;
    },
    clearSelectedContact: (state) => {
      state.selectedContact = null;
    },
    markUserOffline: (
      state,
      action: PayloadAction<{ userId: string; lastSeen: Date }>,
    ) => {
      if (state.selectedContact?._id == action.payload.userId) {
        state.selectedContact.status = false;
        state.selectedContact.lastSeen = action.payload.lastSeen;
      }
    },
    markUserOnline: (state, action: PayloadAction<string>) => {
      if (state.selectedContact?._id == action.payload) {
        state.selectedContact.status = true;
      }
    },
    setContact: (state, action: PayloadAction<Contact[]>) => {
      state.Contacts = action.payload;
    },
    setActiveContact: (state, action: PayloadAction<ActiveContact[]>) => {
      state.activeContacts = action.payload;
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      state.Contacts.unshift(action.payload);
    },
    deleteContact: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.Contacts = state.Contacts.filter((item) => item._id !== id);
    },
    addReceiverMessage: (
      state,
      action: PayloadAction<{
        data: MessageType;
        extra: {
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
      }>,
    ) => {
      const data = action.payload.data;
      const extra = action.payload.extra;
      if (data.sender_id === data.receiver_id) return;
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == data.sender_id,
      );
      if (findInActiveContact !== -1) {
        state.activeContacts[findInActiveContact].lastMessage = data;
      } else {
        state.activeContacts.push({
          _id: extra.senderDetail._id,
          name: extra.senderDetail.name,
          pic: extra.senderDetail.pic,
          lastSeen: extra.senderDetail.lastSeen,
          lastMessage: data,
          unread: 0,
        });
      }
      if (state.selectedContact?._id == data.sender_id) {
        state.selectedContact.messages = state.selectedContact.messages.filter(
          (item) => item._id !== data._id,
        );
        state.selectedContact.messages.push(data);
        state.selectedContact.status = true;
        state.selectedContact.lastSeen = data.createdAt;
      } else {
        state.activeContacts = state.activeContacts.map((item) => {
          if (item._id == extra.senderDetail._id) {
            return { ...item, unread: item.unread + 1 };
          } else {
            return item;
          }
        });
      }
    },
    addSenderMessage: (
      state,
      action: PayloadAction<{
        data: MessageType;
        extra: {
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
      }>,
    ) => {
      const data = action.payload.data;
      const extra = action.payload.extra;
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == data.receiver_id,
      );
      if (findInActiveContact !== -1) {
        state.activeContacts[findInActiveContact].lastMessage = data;
      } else {
        state.activeContacts.push({
          _id: extra.receiverDetail._id,
          name: extra.receiverDetail.name,
          pic: extra.receiverDetail.pic,
          lastSeen: extra.receiverDetail.lastSeen,
          lastMessage: data,
          unread: 0,
        });
      }
      if (state.selectedContact?._id == data.receiver_id) {
        state.selectedContact.messages = state.selectedContact.messages.filter(
          (item) => item._id !== data._id,
        );
        state.selectedContact.messages.push(data);
      } else {
        if (findInActiveContact !== -1) {
          state.activeContacts[findInActiveContact].unread =
            state.activeContacts[findInActiveContact].unread + 1;
        }
      }
    },
    markAllSeen: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id == state.selectedContact?._id) {
        state.selectedContact.messages.forEach((item) => {
          if (item.receiver_id == id) item.seen = "seen";
        });
      }
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == id,
      );
      if (findInActiveContact !== -1) {
        state.activeContacts[findInActiveContact].lastMessage.seen = "seen";
      }
    },
    markAllSeenBYViewer: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id == state.selectedContact?._id) {
        state.selectedContact.messages.forEach((item) => {
          if (item.receiver_id == id) item.seen = "seen";
        });
      }
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == id,
      );
      if (findInActiveContact !== -1) {
        state.activeContacts[findInActiveContact].lastMessage.seen = "seen";
      }
    },
    markSeen: (
      state,
      action: PayloadAction<{
        msg_id: string;
        receiver_id: string;
        lastSeen: Date;
      }>,
    ) => {
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == action.payload.receiver_id,
      );
      state.activeContacts[findInActiveContact].unread = 0;

      if (state.selectedContact?._id == action.payload.receiver_id) {
        state.selectedContact.messages = state.selectedContact.messages.map(
          (item) => {
            if (item._id == action.payload.msg_id) {
              return { ...item, seen: "seen" };
            }
            return item;
          },
        );
        state.selectedContact.status = true;
        state.selectedContact.lastSeen = action.payload.lastSeen;
      }
      if (
        findInActiveContact !== -1 &&
        state.activeContacts[findInActiveContact].lastMessage._id ==
          action.payload.msg_id
      ) {
        state.activeContacts[findInActiveContact].lastMessage.seen = "seen";
      }
    },
    markSemiSeen: (
      state,
      action: PayloadAction<{ messageIds: string[]; receiver_id: string }>,
    ) => {
      const receiver_id = action.payload.receiver_id;
      const messageIds = action.payload.messageIds;
      if (state.selectedContact?._id == receiver_id) {
        state.selectedContact.messages.forEach((item) => {
          if (messageIds.includes(item._id)) {
            item.seen = "semiseen";
          }
        });
      }
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == receiver_id,
      );
      if (findInActiveContact !== -1) {
        const a = state.activeContacts[findInActiveContact].lastMessage;
        if (messageIds.includes(a._id)) {
          a.seen = "semiseen";
        }
      }
    },
    clearUnread: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const findInActiveContact = state.activeContacts.findIndex(
        (item) => item._id == id,
      );
      if (findInActiveContact !== -1)
        state.activeContacts[findInActiveContact].unread = 0;
    },
    setCachedUrls: (state, action: PayloadAction<Record<string, string>>) => {
      const payload = action.payload;
      state.cachedUrls = { ...state.cachedUrls, ...payload };
    },
    setSelectedFor: (state, action: PayloadAction<boolean>) => {
      state.selectedFor = action.payload;
    },
    setSelectionFor: (state, action: PayloadAction<string>) => {
      const id = action.payload;

      let deleted = false;
      state.selectionFor = state.selectionFor.filter((item) => {
        if (item == id) {
          deleted = true;
          return false;
        } else {
          return true;
        }
      });
      if (!deleted) {
        state.selectionFor.push(id);
      }
    },
    clearSelectionFor: (state) => {
      state.selectionFor = [];
    },
    starMsg: (state, action: PayloadAction<{ id: string }>) => {
      const messageID = action.payload.id;
      const userId = state.selectedContact?._id;
      if (!userId || !state.selectedContact) return;
      state.selectedContact.messages = state.selectedContact?.messages.map(
        (item) => {
          if (item._id === messageID) {
            return { ...item, starred: true };
          } else {
            return item;
          }
        },
      );
    },
    unstarMsg: (state, action: PayloadAction<{ id: string }>) => {
      const messageID = action.payload.id;
      const userId = state.selectedContact?._id;
      if (!userId || !state.selectedContact) return;
      state.selectedContact.messages = state.selectedContact?.messages.map(
        (item) => {
          if (item._id === messageID) {
            return { ...item, starred: false };
          } else {
            return item;
          }
        },
      );
    },
    deleteMsg: (
      state,
      action: PayloadAction<
        {
          _id: string;
          deletedFor: boolean;
          inTrash: boolean;
          deletedForEveryone: boolean;
          content: string;
          attachments: any[];
        }[]
      >,
    ) => {
      const updatedData = action.payload;
      if (!state.selectedContact) return;
      const sacl = state.activeContacts.findIndex(
        (item) => item._id === state.selectedContact?._id,
      );
      let previousMessage: MessageType | null = null;
      state.selectedContact.messages = state.selectedContact.messages.reduce(
        (acc: MessageType[], item) => {
          const inUpdate = updatedData.find((inI) => inI._id === item._id);
          if (
            sacl !== -1 &&
            state.activeContacts[sacl].lastMessage._id == inUpdate?._id
          ) {
            if (inUpdate.inTrash) {
              state.activeContacts[sacl].lastMessage = previousMessage
                ? previousMessage
                : {
                    ...state.activeContacts[sacl].lastMessage,
                    ...inUpdate,
                    content: "-",
                    createdAt: "invalid" as unknown as Date,
                  };
            } else {
              state.activeContacts[sacl].lastMessage = {
                ...state.activeContacts[sacl].lastMessage,
                ...inUpdate,
              };
            }
          }
          if (inUpdate) {
            if (inUpdate.deletedForEveryone || inUpdate.inTrash) {
              return acc;
            }
            acc.push({ ...item, ...inUpdate });
          } else {
            acc.push(item);
          }
          previousMessage = item;
          return acc;
        },
        [],
      );
    },
    deleteMsgR: (
      state,
      action: PayloadAction<{ ids: string[]; deletedBy: string }>,
    ) => {
      const ids = action.payload.ids;
      const deletedBy = action.payload.deletedBy;
      const sacl = state.activeContacts.findIndex(
        (item) => item._id === deletedBy,
      );
      if (sacl == -1) return;
      const lastMessage = state.activeContacts[sacl].lastMessage;
      if (ids.includes(lastMessage._id)) {
        state.activeContacts[sacl].lastMessage = {
          ...lastMessage,
          content: "This message was deleted",
          attachments: [],
        };
      }
    },
  },
});
export const {
  setSelectedContact,
  setSelectedContactLoading,
  clearSelectedContact,
  setContact,
  addContact,
  deleteContact,
  setActiveContact,
  addSenderMessage,
  addReceiverMessage,
  markAllSeen,
  markSeen,
  clearUnread,
  markUserOffline,
  markUserOnline,
  markSemiSeen,
  setCachedUrls,
  setSelectedFor,
  setSelectionFor,
  clearSelectionFor,
  starMsg,
  unstarMsg,
  deleteMsg,
  deleteMsgR,
} = ChatSlice.actions;
export default ChatSlice.reducer;
