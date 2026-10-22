import {
  Archive,
  BellOff,
  BookCopy,
  CircleMinus,
  HeartPlus,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  Pin,
  SquareCheck,
  Star,
  Trash,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { MdGroupAdd } from "react-icons/md";

export default function LeftPartMenu({
  setOptions,
}: {
  setOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const optionRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionRef.current &&
        !optionRef.current.contains(event.target as Node)
      ) {
        setOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <li
      ref={optionRef}
      className="flex flex-col items-center gap-0.5 rounded-xl absolute top-10 right-0 border border-borderhl/40 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] whitespace-nowrap min-w-fit p-1 z-100"
    >
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <MdGroupAdd size={16} />
        </span>
        <p className="text-[14px]">New Group</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <Star size={16} />
        </span>
        <p className="text-[14px]">Starred messages</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <SquareCheck size={16} />
        </span>
        <p className="text-[14px]">Select chats</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span className="relative">
          <MessageSquareText size={16} className="rotate-x-180" />
          <span className="absolute top-0.5 right-0 border text-xl h-1 w-1 rounded-full bg-white"></span>
        </span>
        <p className="text-[14px]">Mark all as unread</p>
      </ol>
      <hr className="border border-borderhl/40 w-full my-1" />
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <LockKeyhole size={16} />
        </span>
        <p className="text-[14px]">App lock</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span className="relative">
          <LogOut size={16} className="z-2" />
        </span>
        <p className="text-[14px]">Log out</p>
      </ol>
    </li>
  );
}
