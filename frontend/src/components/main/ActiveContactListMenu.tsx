import { useUnFocus } from "@/hooks/useUnFocus";
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
import { useRef } from "react";

export default function ActiveContactListMenu({
  setOptions,
}: {
  setOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const optionRef = useRef<HTMLOListElement>(null);
  useUnFocus("activecontactellipsis", setOptions, optionRef);

  return (
    <ol
      ref={optionRef}
      className="flex flex-col items-center gap-1 border border-borderhl/40 rounded-xl absolute top-5 right-0 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] whitespace-nowrap min-w-fit p-1 z-50"
    >
      {[
        { icon: Archive, name: "Archive Chat" },
        { icon: BellOff, name: "Mute Notifications" },
        { icon: Pin, name: "Pin Chat" },
        { icon: MessageSquareText, name: "Mark as unread" },
        { icon: HeartPlus, name: "Add to favorites" },
        { icon: BookCopy, name: "Add to list" },
        { icon: CircleMinus, name: "Clear Chat" },
        { icon: Trash, name: "Delete Chat" },
      ].map((item, i) => (
        <li
          key={`activecontactlist/menu/${i}`}
          className="py-2 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer"
        >
          <span>
            <item.icon size={16} />
          </span>
          <p className="text-[14px]">{item.name}</p>
        </li>
      ))}
    </ol>
  );
}
