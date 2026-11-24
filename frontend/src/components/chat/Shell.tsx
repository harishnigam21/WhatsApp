"use client";
import {
  clearSelectedContact,
  clearSelectionFor,
  selectedContactType,
  setRightPartActive,
  setSelectedContact,
  setSelectedContactLoading,
  setSelectedFor,
} from "@/redux/slices/ChatSlice";
import { setInviteTemplate } from "@/redux/slices/LayoutSlice";
import { sendSocketRequest } from "@/redux/slices/SocketSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Shell({
  dataChat,
  invite,
}: {
  dataChat: selectedContactType;
  invite: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((store) => store.user.userInfo?._id);
  const isConnected = useAppSelector((state) => state.socket.isConnected);
  const activeContacts = useAppSelector((store) => store.chat.activeContacts);
  const router = useRouter();

  useEffect(() => {
    if (invite) {
      dispatch(setRightPartActive(true));
      dispatch(setInviteTemplate(true));
      dispatch(setSelectedContactLoading(false));
      return;
    }
    if (!dataChat) {
      dispatch(clearSelectedContact());
      router.push("/");
    } else {
      dispatch(setSelectedContact(dataChat));
      dispatch(setSelectedContactLoading(false));
      dispatch(setSelectedFor(false));
      dispatch(clearSelectionFor());
    }
    return () => {
      dispatch(clearSelectedContact());
    };
  }, [dispatch, dataChat]);
  useEffect(() => {
    if (!dataChat) return;
    const selected = activeContacts.find((item) => item._id == dataChat._id);
    if (!isConnected || !user || !dataChat?._id || selected?.unread == 0)
      return;
    dispatch(
      sendSocketRequest({
        event: "seenAll",
        data: {
          sender_id: dataChat._id,
          receiver_id: user,
        },
      }),
    );
  }, [dispatch, isConnected, user, dataChat?._id]);
  return null;
}
