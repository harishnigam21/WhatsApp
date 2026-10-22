"use client";

import { clearSelectedContact } from "@/redux/slices/ChatSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import {
  Bot,
  Images,
  MessageCircleCode,
  MessageSquare,
  PanelLeftClose,
  Phone,
  ScanSquare,
  UserGroup,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SideBar({
  sidebarpop,
  setSidebarPop,
}: {
  sidebarpop: boolean;
  setSidebarPop: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const user = useAppSelector((store) => store.user.userInfo);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
    <section
      className={`flex flex-col pt-3 items-center gap-1 bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)] ${mainLayout.sidebar ? "w-16 min-h-full p-2 border-r border-borderhl/40" : sidebarpop ? "fixed left-0 z-50 w-16 min-h-full p-2 border-r border-borderhl/40" : "hidden"}`}
    >
      <div className="flex flex-col items-center gap-1">
        {mainLayout.leftpart && !mainLayout.sidebar && sidebarpop && (
          <div
            title="open sidebar"
            className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all"
            onClick={() => {
              setSidebarPop(false);
            }}
          >
            <PanelLeftClose />
          </div>
        )}
        {[
          {
            icon: MessageSquare,
            name: "Chats",
            onClick: () => {
              dispatch(clearSelectedContact());
              router.push("/");
            },
          },
          { icon: Phone, name: "Calls", onClick: () => {} },
          { icon: ScanSquare, name: "Status", onClick: () => {} },
          { icon: MessageCircleCode, name: "Channels", onClick: () => {} },
          { icon: UserGroup, name: "Communities", onClick: () => {} },
        ].map((item, i) => (
          <div
            title={item.name}
            key={`sidebar/up_part/icon/${i}`}
            className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all"
            onClick={item.onClick}
          >
            <item.icon className="" size={20} />
          </div>
        ))}
      </div>
      <hr className="w-8/10 border border-borderhl/40 my-2" />
      <div className="flex flex-col h-full justify-between items-center gap-1">
        <div className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all">
          <Bot className="" size={24} />
        </div>
        <div className="flex flex-col items-center gap-4 pb-4">
          <div className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all">
            <Images className="" size={20}>
              <title>Media</title>
            </Images>
          </div>
          {user?.pic ? (
            <div className="rounded-full size-6 overflow-hidden">
              <Image
                src={user.pic}
                loading="eager"
                width={6}
                height={6}
                alt="user image"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="bg-borderhl rounded-full size-6 cursor-pointer flex items-center justify-center">
              <UserRound size={10}>
                <title>You</title>
              </UserRound>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
