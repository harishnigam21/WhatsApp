"use client";

import { MessageType, setSelectionFor } from "@/redux/slices/ChatSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { formatRelativeDate, formatTimeToAmPm } from "@/utils/dateFormats";
import { Check, CheckCheck, ChevronDown } from "lucide-react";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import AttachmentGrid from "./AttachmentGrid";
import MessageListMenu from "./MessageListMenu";

export default function MessageList() {
  const selectedContact = useAppSelector((store) => store.chat.selectedContact);
  const sectionRef = useRef<HTMLDivElement>(null);
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
      className="flex flex-col gap-1 w-full py-4 sm:py-8 grow justify-end-safe"
    >
      {Object.entries(messages).map(([date, msgs]) => (
        <div
          key={`selectedMessage/date/${date}`}
          className="flex flex-col w-full"
        >
          <small className="bg-bgsec self-center sticky top-2 px-3 py-0.5 z-10 my-2 rounded-full">
            {formatRelativeDate(date)}
          </small>

          {msgs.map((item) => (
            <MessageBody
              sectionRef={sectionRef}
              key={`message/${item._id}`}
              item={item}
              sectionWidth={sectionWidth}
            />
          ))}
        </div>
      ))}

      <div id="scrollToMessage"></div>
    </section>
  );
}

const MessageBody = ({
  item,
  sectionWidth,
  sectionRef,
}: {
  item: MessageType;
  sectionWidth: number;
  sectionRef: RefObject<HTMLDivElement | null>;
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const attachment = item?.attachments || [];
  const attachmentLength = attachment?.length;
  const userID = useAppSelector((store) => store.user.userInfo?._id);
  const { selectedFor, selectionFor } = useAppSelector((store) => store.chat);
  const [options, setOptions] = useState<boolean>(false);
  const [selected, setSelected] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const cid = item._id;
    const isSelected = selectionFor.findIndex((item) => item === cid);
    if (isSelected === -1) {
      setSelected(false);
    } else {
      setSelected(true);
    }
  }, [selectionFor]);
  return (
    <div
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setOptions(true);
      }}
      className={`w-full flex flex-nowrap gap-2 py-0.5 ${item.sender_id === userID && "justify-end"} ${selected && selectedFor && "bg-bgsec/70"} ${selectedFor && "hover:bg-bgsec/70 active:bg-bgsec/70 cursor-pointer"} px-4 sm:px-8 lg:px-16`}
      onClick={() => {
        if (selectedFor) dispatch(setSelectionFor(item._id));
      }}
    >
      {selectedFor && (
        <div
          className={`${item.sender_id === userID && "grow"} flex items-center`}
        >
          <div
            className={`size-4 border rounded-sm border-borderhl self-center ${selected && "bg-pri"} cursor-pointer overflow-hidden hover:border-txpri/50 active:border-txpri/50 flex items-center justify-center transition-all`}
          >
            {selected && (
              <Check
                color="black"
                strokeWidth={3}
                size={12}
                className="mt-0.5"
              />
            )}
          </div>
        </div>
      )}
      <div
        ref={messageRef}
        id={`message/${item._id}`}
        className={`relative group rounded-md flex flex-col flex-nowrap items-center max-w-8/10 ${
          item.sender_id === userID
            ? "bg-[color-mix(in_srgb,var(--color-bgpri)_50%,var(--color-pri)_50%)]"
            : "bg-[color-mix(in_srgb,var(--color-bgpri)_60%,var(--color-borderhl)_100%)]"
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
                <CheckCheck size={14} className="size-3 text-blue-500" />
              ) : (
                <CheckCheck size={14} className="size-3 text-txsec" />
              ))}
          </div>
        </div>
        <div
          className={`absolute top-1 right-1 transition-all group-hover:block ${options ? "block" : "hidden"} group-active:block`}
        >
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setOptions((prev) => !prev);
            }}
          >
            <ChevronDown size={14} />
          </div>
        </div>
        {options && (
          <MessageListMenu
            options={options}
            messageRef={messageRef}
            setOptions={setOptions}
            sectionRef={sectionRef}
          />
        )}
      </div>
    </div>
  );
};
