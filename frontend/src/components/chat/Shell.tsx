"use client";
import {
  clearSelectedContact,
  clearSelectionFor,
  selectedContactType,
  setSelectedContact,
  setSelectedContactLoading,
  setSelectedFor,
} from "@/redux/slices/ChatSlice";
import { sendSocketRequest } from "@/redux/slices/SocketSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Shell({ dataChat }: { dataChat: selectedContactType }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((store) => store.user.userInfo?._id);
  const isConnected = useAppSelector((state) => state.socket.isConnected);
  const activeContacts = useAppSelector((store) => store.chat.activeContacts);
  const router = useRouter();

  useEffect(() => {
    if (!dataChat) {
      dispatch(clearSelectedContact());
      router.push("/");
    } else {
      dispatch(setSelectedContact(dataChat));
      dispatch(setSelectedContactLoading(false));
      dispatch(setSelectedFor(false));
      dispatch(clearSelectionFor());
    }
  }, [dispatch, dataChat]);
  useEffect(() => {
    const selected = activeContacts.find((item) => item._id == dataChat._id);
    if (!isConnected || !user || !dataChat?._id || selected?.unread == 0)
      return;
    dispatch(
      sendSocketRequest({
        event: "seenAll",
        data: {
          sender_id: user,
          receiver_id: dataChat._id,
        },
      }),
    );
  }, [dispatch, isConnected, user, dataChat?._id]);
  return null;
}
