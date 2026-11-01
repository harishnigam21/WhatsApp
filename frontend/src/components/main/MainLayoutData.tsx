"use client";
import {
  ActiveContact,
  Contact,
  setActiveContact,
  setContact,
} from "@/redux/slices/ChatSlice";
import { setMainLoader } from "@/redux/slices/LayoutSlice";
import { setLoginStatus, setUser, User } from "@/redux/slices/UserSlice";
import { useAppDispatch } from "@/redux/Store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function MainLayoutData({
  dataUser,
  dataContacts,
  dataActiveContacts,
}: {
  dataUser: User | null;
  dataContacts: Contact[];
  dataActiveContacts: ActiveContact[];
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    dispatch(setLoginStatus("loading"));
    dispatch(setContact(dataContacts));
    dispatch(setActiveContact(dataActiveContacts));
    if (!dataUser) {
      dispatch(setLoginStatus("unauthenticated"));
      router.push("/login");
    } else {
      dispatch(setUser(dataUser));
      dispatch(setLoginStatus("authenticated"));
      if (dataUser._id) {
        dispatch({ type: "socket/connect", payload: dataUser._id });
      }
    }
    dispatch(setMainLoader(false));
  }, []);
  return null;
}
