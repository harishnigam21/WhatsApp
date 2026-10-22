import {
  Archive,
  BellOff,
  BookCopy,
  CircleMinus,
  HeartPlus,
  MessageSquareText,
  Pin,
  Trash,
} from "lucide-react";
import { useEffect, useRef } from "react";

export default function ActiveContactListMenu({
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
      className="flex flex-col items-center gap-1 border border-borderhl/40 rounded-xl absolute top-5 right-0 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] whitespace-nowrap min-w-fit p-1 z-50"
    >
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <Archive size={16} />
        </span>
        <p className="text-[14px]">Archive Chat</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <BellOff size={16} />
        </span>
        <p className="text-[14px]">Mute Notifications</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <Pin size={16} />
        </span>
        <p className="text-[14px]">Pin Chat</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span className="relative">
          <MessageSquareText size={16} className="rotate-x-180" />
          <span className="absolute top-0.5 right-0 border text-xl h-1 w-1 rounded-full bg-white"></span>
        </span>
        <p className="text-[14px]">Mark as unread</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <HeartPlus size={16} />
        </span>
        <p className="text-[14px]">Add to favorites</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span className="relative">
          <BookCopy size={16} className="z-2" />
        </span>
        <p className="text-[14px]">Add to list</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <CircleMinus size={16} />
        </span>
        <p className="text-[14px]">Clear Chat</p>
      </ol>
      <ol className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer">
        <span>
          <Trash size={16} />
        </span>
        <p className="text-[14px]">Delete Chat</p>
      </ol>
    </li>
  );
}
