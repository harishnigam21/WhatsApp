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
    let layout;
    if (swidth >= 1080) {
      layout = {
        rightpart: true,
        sidebar: true,
        leftpart: true,
      };
    } else if (swidth >= 768) {
      layout = {
        rightpart: true,
        sidebar: false,
        leftpart: true,
      };
    } else if (swidth >= 420) {
      layout = selectedContact
        ? { rightpart: true, sidebar: false, leftpart: false }
        : { rightpart: false, sidebar: true, leftpart: true };
    } else {
      layout = selectedContact
        ? { rightpart: true, sidebar: false, leftpart: false }
        : { rightpart: false, sidebar: false, leftpart: true };
    }

    dispatch(updateMainLayout(layout));
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
