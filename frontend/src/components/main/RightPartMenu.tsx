import { setSelectedFor } from "@/redux/slices/ChatSlice";
import { useAppDispatch } from "@/redux/Store";
import {
  BookCopy,
  CircleX,
  ClockFading,
  Download,
  Heart,
  Info,
  LucideIcon,
  Palette,
  SquareCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";

export default function RightPartMenu({
  optionItem,
  setOptions,
}: {
  optionItem: { icon: LucideIcon; name: string }[];
  setOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const optionRef = useRef<HTMLOListElement>(null);
  const dispatch = useAppDispatch();
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        optionRef.current &&
        !optionRef.current.contains(event.target as Node) &&
        target.id !== "rightellipsis" &&
        !target.closest("#rightellipsis")
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
      className="absolute z-10 top-12 right-0 gap-1 flex flex-col bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] max-w-fit p-1 whitespace-nowrap line-clamp-1 rounded-lg border border-borderhl/40 font-medium"
    >
      {optionItem.map((item, i) => (
        <li
          title={item.name}
          key={`rightbar/up_part/icon/${i}`}
          className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-lg p-2 cursor-pointer transition-all flex items-center gap-2 min-[480px]:hidden"
        >
          <div>
            <item.icon size={16} />
          </div>
          <p className="text-sm">{item.name}</p>
        </li>
      ))}
      {[
        { name: "Contact info", icon: Info, onclick: () => {} },
        {
          name: "Select messages",
          icon: SquareCheck,
          onclick: () => {
            dispatch(setSelectedFor(true));
          },
        },
        { name: "Disappearing messages", icon: ClockFading, onclick: () => {} },
        { name: "Chat theme", icon: Palette, onclick: () => {} },
        { name: "Add to favorites", icon: Heart, onclick: () => {} },
        { name: "Add to list", icon: BookCopy, onclick: () => {} },
        { name: "Export chat", icon: Download, onclick: () => {} },
        { name: "Close chat", icon: CircleX, onclick: () => {} },
      ].map((item, i) => (
        <li
          title={item.name}
          key={`rightbar/up_part/icon/${i}`}
          className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-lg p-2 cursor-pointer transition-all flex items-center gap-2"
          onClick={item.onclick}
        >
          <div>
            <item.icon size={16} />
          </div>
          <p className="text-sm">{item.name}</p>
        </li>
      ))}
    </ol>
  );
}
