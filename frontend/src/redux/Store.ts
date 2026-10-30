import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import UserSlice from "./slices/UserSlice";
import SocketSlice from "./slices/SocketSlice";
import ChatSlice from "./slices/ChatSlice";
import LayoutSlice from "./slices/LayoutSlice";
import { socketMiddleware } from "./socketMiddleware";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { listenerMiddleware } from "./listenerMiddleware";
import "./socketListeners";
enableMapSet();
export const store = configureStore({
  reducer: {
    user: UserSlice,
    socket: SocketSlice,
    chat: ChatSlice,
    layout: LayoutSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(socketMiddleware),
      
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
