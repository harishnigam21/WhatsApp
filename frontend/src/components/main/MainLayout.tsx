"use client";
import React, { useEffect, useState } from "react";
import SideBar from "./SideBar";
import LeftPart from "./LeftPart";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { updateMainLayout } from "@/redux/slices/LayoutSlice";
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const swidth = useAppSelector((store) => store.layout.screenSize.width);
  const selectedContact = useAppSelector((store) => store.chat.selectedContact);
  const [sidebarpop, setSidebarPop] = useState<boolean>(false);
  useEffect(() => {
    if (swidth < 1080) {
      dispatch(
        updateMainLayout({
          rightpart: true,
          sidebar: false,
          leftpart: true,
        }),
      );
    } else {
      dispatch(
        updateMainLayout({
          rightpart: true,
          sidebar: true,
          leftpart: true,
        }),
      );
    }
    if (swidth < 768) {
      if (selectedContact) {
        dispatch(
          updateMainLayout({
            rightpart: true,
            sidebar: false,
            leftpart: false,
          }),
        );
      } else {
        dispatch(
          updateMainLayout({
            rightpart: false,
            sidebar: true,
            leftpart: true,
          }),
        );
      }
    }
    if (swidth < 420) {
      if (selectedContact) {
        dispatch(
          updateMainLayout({
            rightpart: true,
            sidebar: false,
            leftpart: false,
          }),
        );
      } else {
        dispatch(
          updateMainLayout({
            rightpart: false,
            sidebar: false,
            leftpart: true,
          }),
        );
      }
    }
  }, [swidth, selectedContact, dispatch]);
  useEffect(() => {
    setSidebarPop(false);
  }, [swidth]);
  return (
    <section className="w-full h-full grow flex overflow-hidden">
      {/* sidebar */}
      <SideBar sidebarpop={sidebarpop} setSidebarPop={setSidebarPop} />
      {/* participant and contact list */}
      <LeftPart sidebarpop={sidebarpop} setSidebarPop={setSidebarPop} />
      {/* chat Area */}
      {children}
    </section>
  );
}
