import { useState } from "react";
import { media } from "../../../assets/data/media";
import { formatChatMessageDate } from "../../../utils/getDate";

export default function ByYouRequest({ item, index }) {
  const [show, setShow] = useState(false);
  return (
    <article
      onClick={() => setShow((prev) => !prev)}
      style={{ animationDuration: `${(index + 1) * 150}ms` }}
      className={`cursor-pointer animate-[expandRight_0.5s_ease]`}
    >
      {item.type == "connection" && (
        <div className="flex flex-col gap-2 justify-center-safe bg-secondary text-black rounded-xl py-2 px-4">
          <div
            className={`flex gap-2 flex-col ${show ? "max-h-80" : "max-h-[2.2ch]"} transition-all ease-in duration-100 overflow-hidden`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex">
                You sends follow request to {item.receiver_id.name}
                <media.FaCaretDown
                  className={`cursor-pointer transition-all ${show ? "rotate-180" : "rotate-0"} self-start`}
                />
              </span>
              <span className="self-start">
                {formatChatMessageDate(item.createdAt)}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="px-3 rounded-full bg-red-500 text-white uppercase text-sm py-1">
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
