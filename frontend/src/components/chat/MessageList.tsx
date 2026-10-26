"use client";

import { MessageType } from "@/redux/slices/ChatSlice";
import { useAppSelector } from "@/redux/Store";
import { formatRelativeDate, formatTimeToAmPm } from "@/utils/dateFormats";
import { Check, CheckCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AttachmentGrid from "./AttachmentGrid";

export default function MessageList() {
  const selectedContact = useAppSelector((store) => store.chat.selectedContact);
  const sectionRef = useRef<HTMLDivElement>(null);
  const userID = useAppSelector((store) => store.user.userInfo?._id);
  const [sectionWidth, setSectionWidth] = useState<number>(0);
  const messages = useMemo(() => {
    return (selectedContact?.messages ?? []).reduce(
      (acc: Record<string, MessageType[]>, item) => {
        const dateObj = new Date(item.createdAt);

        // Group using the local calendar date
        const date = [
          dateObj.getFullYear(),
          String(dateObj.getMonth() + 1).padStart(2, "0"),
          String(dateObj.getDate()).padStart(2, "0"),
        ].join("-");

        if (!acc[date]) {
          acc[date] = [];
        }

        acc[date].push(item);
        return acc;
      },
      {},
    );
  }, [selectedContact?.messages]);

  if (!selectedContact) return null;
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSectionWidth(entry.contentRect.width);
      }
    });
    observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <section
      ref={sectionRef}
      className="flex flex-col gap-1 w-full py-4 sm:py-8 px-4 sm:px-8 lg:px-16 grow justify-end-safe"
    >
      {Object.entries(messages).map(([date, msgs]) => (
        <div
          key={`selectedMessage/date/${date}`}
          className="flex flex-col gap-1 w-full"
        >
          <small className="bg-bgsec self-center sticky top-2 px-3 py-0.5 z-10 my-2 rounded-full">
            {formatRelativeDate(date)}
          </small>

          {msgs.map((item) => {
            const attachment = item?.attachments || [];
            const attachmentLength = attachment?.length;
            return (
              <div
                key={`message/${item._id}`}
                id={`message/${item._id}`}
                className={` rounded-md flex flex-col flex-nowrap items-center overflow-hidden max-w-8/10 ${
                  item.sender_id === userID
                    ? "self-end bg-[color-mix(in_srgb,var(--color-bgpri)_50%,var(--color-pri)_50%)]"
                    : "self-start bg-[color-mix(in_srgb,var(--color-bgpri)_60%,var(--color-borderhl)_100%)]"
                }`}
              >
                {attachment && attachmentLength > 0 && (
                  <AttachmentGrid
                    attachment={attachment}
                    attachmentLength={attachmentLength}
                    sectionWidth={sectionWidth}
                  />
                )}
                <div className="flex flex-nowrap w-full py-0.5 px-1.5 mt-1">
                  {!attachment ||
                    (attachment.length <= 1 && (
                      <p className="text-xs sm:text-sm md:text-base pb-1 whitespace-pre-wrap">
                        {item.content}
                      </p>
                    ))}

                  <div className="ml-2 -mb-0.5 flex flex-nowrap grow justify-end items-end whitespace-nowrap">
                    <small className="text-txpri/75 text-[10px] mr-1">
                      {formatTimeToAmPm(item.createdAt)}
                    </small>

                    {item.sender_id === userID &&
                      (item.seen === "unseen" ? (
                        <Check size={14} className="size-3 text-txsec" />
                      ) : item.seen === "seen" ? (
                        <CheckCheck
                          size={14}
                          className="size-3 text-blue-500"
                        />
                      ) : (
                        <CheckCheck size={14} className="size-3 text-txsec" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div id="scrollToMessage"></div>
    </section>
  );
}
