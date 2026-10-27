import {
  Archive,
  BellOff,
  BookCopy,
  Bot,
  CircleMinus,
  Copy,
  FaceSlightlySmiling,
  Forward,
  HeartPlus,
  MessageSquareText,
  Pin,
  Reply,
  Star,
  ThumbsDown,
  Trash,
} from "lucide-react";
import { RefObject, useEffect, useRef, useState } from "react";

export default function MessageListMenu({
  setOptions,
  options,
  sectionRef,
  messageRef,
}: {
  options: boolean;
  setOptions: React.Dispatch<React.SetStateAction<boolean>>;
  sectionRef: RefObject<HTMLDivElement | null>;
  messageRef: RefObject<HTMLDivElement | null>;
}) {
  const optionRef = useRef<HTMLOListElement>(null);
  const [positionClass, setPositionClass] = useState(
    "bottom-10 left-0 opacity-0",
  );
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        optionRef.current &&
        messageRef.current &&
        !optionRef.current.contains(target) &&
        !messageRef.current.contains(target)
      ) {
        setOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (!optionRef.current || !sectionRef.current) return;

    const rect = optionRef.current.getBoundingClientRect();
    const parentRect = sectionRef.current.getBoundingClientRect();
    const relativeRect = {
      top: rect.top - parentRect.top,
      left: rect.left - parentRect.left,
      bottom: rect.bottom - parentRect.top,
      right: rect.right - parentRect.left,
      width: rect.width,
      height: rect.height,
    };
    const spaceBelow = window.innerHeight - relativeRect.bottom;
    const spaceAbove = relativeRect.top;
    if (spaceAbove > spaceBelow) {
      if (relativeRect.left < relativeRect.width) {
        setPositionClass("bottom-10 left-0");
      } else {
        setPositionClass("bottom-10 right-0");
      }
    } else {
      if (relativeRect.left < relativeRect.width) {
        setPositionClass("top-10 left-0");
      } else {
        setPositionClass("top-10 right-0");
      }
    }
  }, [options]);
  return (
    <ol
      ref={optionRef}
      className={`flex flex-col items-center border border-borderhl/40 rounded-xl absolute ${positionClass} bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] whitespace-nowrap min-w-fit w-40 p-1 z-50 `}
    >
      {[
        { icon: Reply, name: "Reply" },
        { icon: Copy, name: "Copy" },
        { icon: FaceSlightlySmiling, name: "React" },
        { icon: Forward, name: "Forward" },
        { icon: Pin, name: "Pin" },
        { icon: Bot, name: "Ask with AI" },
        { icon: Star, name: "Star" },
        { icon: ThumbsDown, name: "Report" },
        { icon: Trash, name: "Delete" },
      ].map((item, i) => (
        <li
          key={`messagelist/menu/${i}`}
          className="py-1.5 px-3 rounded-md hover:bg-borderhl/40 active:bg-borderhl/40 flex items-center gap-2 font-medium w-full cursor-pointer"
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
