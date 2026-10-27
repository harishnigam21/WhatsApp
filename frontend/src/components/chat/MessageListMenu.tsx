import {
  Bot,
  Copy,
  FaceSlightlySmiling,
  Forward,
  Pin,
  Reply,
  Star,
  ThumbsDown,
  Trash,
} from "lucide-react";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { RefObject, useEffect } from "react";

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
  const section = sectionRef.current;
  const { refs, floatingStyles } = useFloating({
    open: options,
    onOpenChange: setOptions,
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(8),
      flip({
        boundary: section ?? undefined,
        padding: 8,
      }),
      shift({
        boundary: section ?? undefined,
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });
  useEffect(() => {
    if (messageRef.current) {
      refs.setPositionReference(messageRef.current);
    }
  }, [messageRef, refs]);

  useEffect(() => {
    if (!options) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !refs.floating.current?.contains(target) &&
        !messageRef.current?.contains(target)
      ) {
        setOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [options, messageRef, refs, setOptions]);
  return (
    <FloatingPortal>
      <ol
        ref={refs.setFloating}
        style={floatingStyles}
        className={`flex flex-col items-center border border-borderhl/40 rounded-xl absolute bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] whitespace-nowrap min-w-fit w-40 p-1 z-50 `}
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
    </FloatingPortal>
  );
}
