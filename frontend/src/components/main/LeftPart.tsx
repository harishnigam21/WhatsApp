"use client";

import { useAppSelector } from "@/redux/Store";
import {
  Archive,
  ArrowLeft,
  EllipsisVertical,
  LockKeyhole,
  PanelLeftOpen,
  Plus,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { IoKeypad } from "react-icons/io5";
import { MdGroupAdd, MdGroups, MdPersonAddAlt1 } from "react-icons/md";
import ActiveContactList from "./ActiveContactList";
import LeftPartMenu from "./LeftPartMenu";
import { BiSolidCommentAdd } from "react-icons/bi";

export default function LeftPart({
  sidebarpop,
  setSidebarPop,
}: {
  sidebarpop: boolean;
  setSidebarPop: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [searchFocus, setSearcFocus] = useState<boolean>(false);
  const [filterSelected, setFiterSelected] = useState<string>("all");
  const [showContact, setShowContact] = useState<boolean>(false);
  const user = useAppSelector((store) => store.user.userInfo);
  const { Contacts, activeContacts } = useAppSelector((store) => store.chat);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const [options, setOptions] = useState<boolean>(false);
  const router = useRouter();
  return (
    <section
      className={`${mainLayout.leftpart ? `relative ${!mainLayout.rightpart ? "w-full" : "min-w-90 lg:min-w-115"} min-h-full bg-bgsec/40 border-r border-borderhl/40 z-30 flex flex-col` : "hidden"}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setOptions(true);
      }}
    >
      {/* Contact list`` */}
      <article
        className={`flex flex-col gap-2 absolute top-0 left-0 ${showContact ? "w-full p-4 opacity-100" : "w-0 opacity-0 p-0"} transition-all ease-in-out h-full z-20 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] duration-500 whitespace-nowrap overflow-x-hidden`}
      >
        <div className="flex flex-col gap-2 sticky top-0 ">
          {/* heading */}
          <div className="flex flex-nowrap justify-between gap-2 items-center">
            <div className="flex flex-nowrap gap-3 items-center">
              <div
                className="p-2 hover:bg-bgsec active:bg-bgsec rounded-full cursor-pointer transition-all"
                onClick={() => setShowContact(false)}
              >
                <ArrowLeft size={20} />
              </div>
              <p className="mb-1">New Chat</p>
            </div>
            <IoKeypad className="size-6" />
          </div>
          {/* search */}
          <div
            className={`w-full my-2 mt-4 self-center bg-bgsec rounded-full flex flex-nowrap items-center py-1 px-3 gap-2 ${searchFocus && "border border-pri"}`}
          >
            <Search strokeWidth={1} size={16} />
            <input
              type="searchPeople"
              name="searchPeople"
              id="searchPeople"
              placeholder="Search name, number"
              className="w-full py-1.5 text-sm outline-none focus:outline-none place-content-center"
              onFocus={() => {
                setSearcFocus(true);
              }}
              onBlur={() => {
                setSearcFocus(false);
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-borderhl">
          {/* new peoples */}
          <div className="flex flex-col">
            {[
              { icon: MdGroupAdd, name: "New Group" },
              { icon: MdPersonAddAlt1, name: "New Contact" },
              { icon: MdGroups, name: "New Community" },
            ].map((item, i) => (
              <div
                key={`contactpanel/new/list/${i}`}
                className="flex p-3 gap-4 rounded-xl items-center cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all"
              >
                <div className="rounded-full p-2 size-11 bg-pri text-black">
                  <item.icon className="size-full" />
                </div>
                <p>{item.name}</p>
              </div>
            ))}
          </div>
          {/* your self */}
          <div
            className="flex p-3 gap-4 rounded-xl items-center cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all"
            onClick={() => {
              router.push(`/c=${user?._id}`);
              setShowContact(false);
            }}
          >
            <div className="rounded-full overflow-hidden size-11 bg-pri text-black">
              {user?.pic ? (
                <Image
                  loading="eager"
                  src={user.pic}
                  width={10}
                  height={10}
                  alt="user pic"
                  className="size-full object-cover object-center"
                />
              ) : (
                <div className="size-full p-1 flex items-center justify-center uppercase font-bold">
                  {user?.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between">
              <p className="">
                {user?.phoneCode} {user?.phone} (you)
              </p>
              <p className="text-txpri/70 text-sm">Message yourself</p>
            </div>
          </div>
          {/* other contacts */}
          {Contacts.map((item, i) => (
            <div
              key={`contact/other/${i}`}
              onClick={() => {
                router.push(`/c=${item._id}`);
                setShowContact(false);
              }}
              className="flex p-3 gap-4 rounded-xl items-center cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all"
            >
              <div className="rounded-full overflow-hidden size-11 bg-pri/70 text-txpri">
                {item.pic ? (
                  <Image
                    loading="eager"
                    src={item.pic}
                    width={10}
                    height={10}
                    alt="user pic"
                    className="size-full"
                  />
                ) : (
                  <div className="size-full p-1 flex items-center justify-center uppercase font-bold">
                    {item.name.slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between">
                <p className="">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      </article>
      {/* Active contact list */}
      <article className="flex flex-col absolute top-0 left-0 w-full h-full z-10 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)]">
        {/* heading */}
        <div className="flex justify-between items-center py-3 px-5">
          <div className="flex flex-nowrap items-center gap-4">
            {mainLayout.leftpart && !mainLayout.sidebar && !sidebarpop && (
              <div
                title="open sidebar"
                className="-ml-2 cursor-pointer"
                onClick={() => {
                  setSidebarPop(true);
                }}
              >
                <PanelLeftOpen />
              </div>
            )}
            <h3 className="text-[21px] font-bold text-txpri/95">
              {process.env.NEXT_PUBLIC_PROJECT_NAME}
            </h3>
          </div>
          <div className="flex flex-nowrap items-center gap-2">
            <div className="relative">
              <div
                onClick={() => {
                  setOptions((prev) => !prev);
                }}
                className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer"
              >
                <EllipsisVertical size={20} strokeWidth={3} className="" />
              </div>
              {options && <LeftPartMenu setOptions={setOptions} />}
            </div>
            <div
              className="p-2 cursor-pointer bg-pri rounded-full"
              onClick={() => setShowContact((prev) => !prev)}
            >
              <BiSolidCommentAdd
                color="black"
                className="size-6 rotate-x-180"
              />
            </div>
          </div>
        </div>
        {/* search and filter`` */}
        <div className="px-5 w-full flex flex-col">
          {/* search bar`` */}
          <div
            className={`w-full bg-bgsec rounded-full flex flex-nowrap items-center py-1 px-3 gap-2 ${searchFocus && "border border-pri"}`}
          >
            <Search strokeWidth={1} size={16} />
            <input
              type="searchContact"
              name="searchContact"
              id="searchContact"
              placeholder="Search or start a new chat"
              className="w-full py-1.5 text-sm outline-none focus:outline-none place-content-center"
              onFocus={() => {
                setSearcFocus(true);
              }}
              onBlur={() => {
                setSearcFocus(false);
              }}
            />
          </div>
          {/* filter button`` */}
          <div className="flex flex-nowrap items-center mt-3 gap-2 overflow-x-auto scrollbar-none">
            {[
              { name: "All", key: "all" },
              { name: "Unread", key: "unread" },
              { name: "Favorites", key: "favorites" },
              { name: "Groups", key: "Groups" },
            ].map((item, i) => (
              <button
                key={`leftpart/filter/${i}`}
                className={`${item.key.toLowerCase() == filterSelected ? "bg-pri/20" : "hover:bg-bgsec active:bg-bgsec"} bg-bgsec/50 text-txpri/75 rounded-full py-1 px-3 border border-borderhl/40 text-sm font-medium cursor-pointer transition-all`}
                onClick={() => {
                  setFiterSelected(item.key.toLowerCase());
                }}
              >
                {item.name}
              </button>
            ))}
            <button
              className={` bg-bgsec/50 text-txpri/75 rounded-full p-1 border border-borderhl/40 text-sm font-medium cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all`}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        {/*Achive && chatting users */}
        <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-borderhl">
          {/* archive */}
          <div className="px-2 my-3 w-full text-txpri/75">
            <div className="flex items-center gap-6 px-6 py-3 rounded-xl cursor-pointer hover:bg-bgsec active:bg-bgsec">
              <Archive size={20} />
              <p>Archived</p>
            </div>
          </div>
          {activeContacts.length > 0 ? (
            activeContacts.map((item, i) => (
              <ActiveContactList
                key={`leftbar/contact/listed/${i}`}
                item={item}
                user={user}
              />
            ))
          ) : (
            <div className="grow w-full h-full flex items-center justify-center text-txpri/70">
              no chats
            </div>
          )}
        </div>
        <hr className="self-center border w-full border-borderhl/40 my-2" />
        <div className="flex flex-wrap items-center text-center text-xs gap-1 pb-2 px-2 justify-center">
          <span>
            <LockKeyhole size={10} />
          </span>
          <span>
            Your personal messages are{" "}
            <span className="text-pri font-medium cursor-pointer">
              end-to-end encrypted
            </span>
          </span>
        </div>
      </article>
    </section>
  );
}
