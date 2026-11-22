import {
  Archive,
  EllipsisVertical,
  LockKeyhole,
  PanelLeftOpen,
  Plus,
  Search,
} from "lucide-react";
import ActiveContactList from "./ActiveContactList";
import { BiSolidCommentAdd } from "react-icons/bi";
import LeftPartMenu from "./LeftPartMenu";
import { useState } from "react";
import { useAppSelector } from "@/redux/Store";

export default function ActiveContact({
  options,
  setOptions,
  setShowContact,
  searchFocus,
  setSearcFocus,
  sidebarpop,
  setSidebarPop,
  mainLayout,
}: {
  options: boolean;
  setOptions: React.Dispatch<React.SetStateAction<boolean>>;
  setShowContact: React.Dispatch<React.SetStateAction<boolean>>;
  searchFocus: boolean;
  setSearcFocus: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarpop: boolean;
  setSidebarPop: React.Dispatch<React.SetStateAction<boolean>>;
  mainLayout: {
    sidebar: boolean;
    leftpart: boolean;
    rightpart: boolean;
  };
}) {
  const [filterSelected, setFiterSelected] = useState<string>("all");
  const { activeContacts } = useAppSelector((store) => store.chat);
  const user = useAppSelector((store) => store.user.userInfo);

  return (
    <article className="flex flex-col absolute top-0 left-0 w-full h-full z-10 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)]">
      {/* heading */}
      <div className="flex justify-between items-center py-3 px-5">
        <div className="flex flex-nowrap items-center gap-4">
          {mainLayout.leftpart && !mainLayout.sidebar && !sidebarpop && (
            <div
              id="sidebarbtn"
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
              id="leftellipsis"
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
            <BiSolidCommentAdd color="black" className="size-6 rotate-x-180" />
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
  );
}
