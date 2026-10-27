import {
  LockKeyhole,
  LogOut,
  MessageSquareText,
  SquareCheck,
  Star,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import { MdGroupAdd } from "react-icons/md";

export default function LeftPartMenu({
  setOptions,
}: {
  setOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const optionRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        optionRef.current &&
        !optionRef.current.contains(event.target as Node) &&
        target.id !== "leftellipsis" &&
        !target.closest("#leftellipsis")
      ) {
        setOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <ol
      ref={optionRef}
      className="flex flex-col items-center gap-0.5 rounded-xl absolute top-10 right-0 border border-borderhl/40 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] whitespace-nowrap min-w-fit p-1 z-100"
    >
      {[
        { icon: MdGroupAdd, name: "New Group" },
        { icon: Star, name: "Starred messages" },
        { icon: SquareCheck, name: "Select chats" },
        { icon: MessageSquareText, name: "Mark all as unread" },
        { icon: LockKeyhole, name: "App lock" },
        { icon: LogOut, name: "Log out" },
      ].map((item, i) => (
        <React.Fragment key={`leftpart/menu/${i}`}>
          <li className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
            <span>
              <item.icon size={16} />
            </span>
            <p className="text-[14px]">{item.name}</p>
          </li>
          {i == 3 && <hr className="border border-borderhl/40 w-full my-1" />}
        </React.Fragment>
      ))}
    </ol>
  );
}
