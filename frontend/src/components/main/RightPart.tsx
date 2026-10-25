"use client";

import { mediaList } from "@/assets/scripts/mediaList";
import { scrollToSection } from "@/hooks/useScrollToSection";
import { sendSocketRequest } from "@/redux/slices/SocketSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { lastSeen } from "@/utils/dateFormats";
import {
  Bot,
  EllipsisVertical,
  FaceSlightlySmiling,
  FileSpreadsheet,
  FileText,
  Mic,
  Paperclip,
  Phone,
  Plus,
  Search,
  UserPlus,
  Video,
  File as GenericFile,
  X,
  LoaderCircle,
  Headphones,
  ArrowLeft,
  Info,
  CircleX,
  Download,
  BookCopy,
  Heart,
  Palette,
  ClockFading,
  SquareCheck,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import Emoji from "../chat/Emoji";
import AttachItems from "../chat/AttachItems";
import { FaFilePdf } from "react-icons/fa";
import { socket } from "@/redux/socketMiddleware";
import {
  addSenderMessage,
  clearSelectedContact,
  MessageType,
  setCachedUrls,
} from "@/redux/slices/ChatSlice";
import AttachmentSection from "./AttachmentSection";
import axios from "axios";
import { cleanupOldMedia, saveToDB } from "@/utils/indexedDB";
import toast from "react-hot-toast";
import { SiVlcmediaplayer } from "react-icons/si";
import { updateMainLayout } from "@/redux/slices/LayoutSlice";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/utils/formatBytes";

export default function RightPart({
  children,
}: {
  children?: React.ReactNode;
}) {
  const optionItem = [
    { icon: Video, name: "Video Call" },
    { icon: Phone, name: "Voice Call" },
    { icon: Search, name: "Search" },
  ];
  const { selectedContact } = useAppSelector((store) => store.chat);
  const userId = useAppSelector((store) => store.user.userInfo?._id);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const [sendDisable, setSendDisable] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [showAttachOptions, setShowAttachOptions] = useState<boolean>(false);
  const [switchTextArea, setSwitchTextArea] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [files, setFiles] = useState<
    { file: File; URL: string; message: string }[]
  >([]);
  const [parentMessage, setParentMessage] = useState<string | null>(null);
  const MessageAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTransferFiles, setActiveTransferFiles] = useState<
    Record<string, "start" | "loading" | "stop" | "error">
  >({});
  const dispatch = useAppDispatch();
  const router = useRouter();
  const handleSendMessage = async () => {
    const attachmentSize: number =
      Number(process.env.NEXT_PUBLIC_ATTACHMENT_SIZE) || 10485760;
    let uploadedUrls: { name: string; url: string }[] = [];
    const overSizeFile = files.filter(
      (file) => file.file.size > attachmentSize,
    );
    if (overSizeFile && overSizeFile.length > 0) {
      toast.error(`No file should be more than ${formatBytes(attachmentSize)}`);
      return;
    }
    try {
      setLoading(true);
      if (files && files.length > 0 && selectedContact) {
        let currentParent = parentMessage;
        for (const file of files) {
          setActiveTransferFiles((prev) => ({ ...prev, [file.URL]: "start" }));
          const buffer = await file.file.arrayBuffer();
          const result = await new Promise<any>((resolve, reject) => {
            setActiveTransferFiles((prev) => ({
              ...prev,
              [file.URL]: "loading",
            }));

            socket?.timeout(120000).emit(
              "upload-file",
              {
                sender_id: userId,
                receiver_id: selectedContact._id,
                name: file.file.name,
                type: file.file.type,
                lastModified: file.file.lastModified,
                size: file.file.size,
                message: file.message,
                parent: currentParent,
                buffer,
              },
              (err: Error | null, response: any) => {
                if (err) {
                  return reject(err);
                }
                if (!response?.success) {
                  setActiveTransferFiles((prev) => ({
                    ...prev,
                    [file.URL]: "error",
                  }));

                  toast.error(response.message);
                  return reject(
                    new Error(response?.message ?? "Upload failed"),
                  );
                }
                resolve(response);
              },
            );
          });
          setActiveTransferFiles((prev) => ({ ...prev, [file.URL]: "stop" }));

          if (result.parent) {
            currentParent = result.parent;
            setParentMessage(result.parent);
          }
          if (result.messageData && result.extraData) {
            const messageData: MessageType = result.messageData!;
            dispatch(
              addSenderMessage({
                data: messageData,
                extra: result.extraData!,
              }),
            );
            if (messageData.attachments) {
              const urls = messageData.attachments.map((item) => ({
                url: item.url,
                name: item.name,
              }));
              uploadedUrls = urls;
            }
          }
        }
      } else {
        if (!input || !selectedContact) return;
        dispatch(
          sendSocketRequest({
            event: "sendMessage",
            data: {
              sender_id: userId,
              receiver_id: selectedContact._id,
              content: input.trim(),
            },
          }),
        );
        setInput("");
        setSwitchTextArea(false);
      }
    } catch (error) {
      toast.error("Failed to send Attachment.");
      console.log("Error sending message:", error);
    } finally {
      try {
        //not refetching blob again through uploaded url
        // const downloadPromises = uploadedUrls.map(async (itemUrl) => {
        //   const res = await axios.get(itemUrl.url, {
        //     responseType: "blob",
        //   });
        //   const downloadedBlob: Blob = res.data;
        //   await saveToDB(itemUrl.url, downloadedBlob);
        //   const nextLocalUrl = URL.createObjectURL(downloadedBlob);
        //   dispatch(
        //     setCachedUrls({
        //       [itemUrl.url]: nextLocalUrl,
        //     }),
        //   );
        // });

        //using system blob for sender
        const downloadPromises = files.map(async (file) => {
          const downloadedBlob: Blob = new Blob([file.file], {
            type: file.file.type,
          });
          const itemUrl = uploadedUrls.find(
            (item) => item.name === file.file.name,
          );
          if (itemUrl) {
            await saveToDB(itemUrl.url, downloadedBlob);
            dispatch(
              setCachedUrls({
                [itemUrl.url]: file.URL,
              }),
            );
          }
        });
        await Promise.all(downloadPromises);
        await cleanupOldMedia();
      } catch (cacheError) {
        console.error("Error caching files to IndexedDB:", cacheError);
      } finally {
        setParentMessage("");
        setLoading(false);
        // files.forEach((item) => URL.revokeObjectURL(item.URL)); //not removing now
        setFiles([]);
      }
    }
  };
  const [options, setOptions] = useState<boolean>(false);
  const optionRef = useRef<HTMLOListElement>(null);
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
  useEffect(() => {
    const container = MessageAreaRef.current;
    const messages = selectedContact?.messages;

    if (!container || !messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const id = lastMessage?._id
      ? `message/${lastMessage._id}`
      : "scrollToMessage";

    let animationFrameId: number | null = null;
    let attempts = 0;
    const maxAttempts = 30; // Prevent infinite loops (~0.5 seconds at 60fps)

    const tryScroll = () => {
      const success = scrollToSection(id, MessageAreaRef);

      if (!success && attempts < maxAttempts) {
        attempts++;
        animationFrameId = requestAnimationFrame(tryScroll);
      }
    };

    animationFrameId = requestAnimationFrame(tryScroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [selectedContact, scrollToSection]);

  useEffect(() => {
    if (input.trim().length > 0) {
      setSendDisable(false);
    } else {
      setSendDisable(true);
    }
  }, [input]);
  if (!selectedContact) return;
  return (
    <section
      className={`${mainLayout.rightpart ? "relative min-w-10 grow flex flex-col bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_10%)]" : "hidden"}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setOptions(true);
      }}
    >
      {/* heading */}
      <div className="w-full box-border py-3 px-1 sm:px-4 flex flex-nowrap justify-between gap-1 h-16 bg-bgsec/40">
        <div className="flex flex-nowrap gap-3 items-center whitespace-nowrap">
          <div
            title="go back"
            className="flex md:hidden justify-center items-center cursor-pointer"
            onClick={() => {
              dispatch(
                updateMainLayout({
                  sidebar: true,
                  leftpart: true,
                  rightpart: false,
                }),
              );
              dispatch(clearSelectedContact());
              router.push("/");
            }}
          >
            <ArrowLeft size={20} className="scale-x-125" />
          </div>
          <div className="size-full aspect-square border rounded-full overflow-hidden">
            {selectedContact.pic ? (
              <Image
                loading="eager"
                src={selectedContact.pic}
                width={10}
                height={10}
                alt="user pic"
                className="size-full object-cover object-center"
              />
            ) : (
              <small className="size-full p-1 flex items-center justify-center uppercase font-bold">
                {selectedContact?.name.slice(0, 2)}
              </small>
            )}
          </div>
          <div className="self-center flex flex-col">
            <h3 className="font-bold">{selectedContact.name}</h3>
            <small className="text-[10px] text-txpri/40">
              {selectedContact.status ? (
                <span className="">Online</span>
              ) : (
                <span className="">
                  last seen {lastSeen(selectedContact.lastSeen)}
                </span>
              )}
            </small>
          </div>
        </div>
        <div className="flex-nowrap gap-3 flex">
          {optionItem.map((item, i) => (
            <div
              title={item.name}
              key={`rightbar/up_part/icon/${i}`}
              className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all hidden min-[480px]:block"
            >
              <item.icon className="size-5" />
            </div>
          ))}
          <div title="Menu" className="flex flex-col relative">
            <div
              className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all"
              onClick={() => setOptions((prev) => !prev)}
            >
              <EllipsisVertical className="size-5" />
            </div>
            {options && (
              <ol
                ref={optionRef}
                className="absolute z-10 top-9 right-0 gap-1 flex flex-col bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_40%)] max-w-fit p-1 whitespace-nowrap line-clamp-1 rounded-lg border border-borderhl/40 font-medium"
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
                  { name: "Contact info", icon: Info },
                  { name: "Select messages", icon: SquareCheck },
                  { name: "Disappearing messages", icon: ClockFading },
                  { name: "Chat theme", icon: Palette },
                  { name: "Add to favorites", icon: Heart },
                  { name: "Add to list", icon: BookCopy },
                  { name: "Export chat", icon: Download },
                  { name: "Close chat", icon: CircleX },
                ].map((item, i) => (
                  <li
                    title={item.name}
                    key={`rightbar/up_part/icon/${i}`}
                    className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-lg p-2 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <div>
                      <item.icon size={16} />
                    </div>
                    <p className="text-sm">{item.name}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
      {/* body */}
      <article className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-contain bg-center bg-repeat opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url(${mediaList?.wCover?.src || mediaList?.wCover})`,
          }}
        />
        <article className="relative w-full h-full bg-contain bg-center bg-repeat flex flex-col justify-between">
          {/* chat area */}
          <article
            ref={MessageAreaRef}
            className=" grow overflow-y-auto scrollbar-thin scrollbar-thumb-borderhl h-10 flex flex-col justify-end-safe"
          >
            {children}
          </article>
          {/* input field */}
          <div className="px-4 w-full flex flex-col justify-center mb-2 items-center">
            <div className="relative w-full">
              <Emoji
                setMessage={setInput}
                showPicker={showPicker}
                setShowPicker={setShowPicker}
              />
            </div>
            <div className="relative w-full">
              <AttachItems
                files={files}
                setFiles={setFiles}
                showAttachOptions={showAttachOptions}
                setShowAttachOptions={setShowAttachOptions}
              />
            </div>
            <div className="w-full rounded-3xl bg-[color-mix(in_srgb,var(--color-bgpri)_50%,var(--color-bgsec)_100%)]">
              <div className="flex flex-col flex-nowrap bg-borderhl/30 border border-borderhl/60 items-center w-full rounded-3xl p-1.5">
                {switchTextArea && (
                  <div className="p-1 h-fit overflow-hidden w-full">
                    <TextArea
                      input={input}
                      setInput={setInput}
                      setSwitchTextArea={setSwitchTextArea}
                      handleSendMessage={handleSendMessage}
                    />
                  </div>
                )}
                <div className="flex flex-nowrap justify-between items-center w-full">
                  <div className="flex flex-nowrap items-center">
                    <div
                      className="rounded-full p-2 hover:bg-borderhl/30 cursor-pointer flex self-end"
                      onClick={() => setShowAttachOptions((prev) => !prev)}
                    >
                      <Paperclip
                        size={20}
                        strokeWidth={2}
                        className=" -rotate-45"
                      />
                    </div>
                    <div
                      className="rounded-full p-2 hover:bg-borderhl/30 cursor-pointer flex self-end mr-2"
                      onClick={() => setShowPicker((prev) => !prev)}
                    >
                      <FaceSlightlySmiling
                        size={20}
                        strokeWidth={2}
                        className=""
                      />
                    </div>
                  </div>
                  {!switchTextArea && (
                    <TextArea
                      input={input}
                      setInput={setInput}
                      setSwitchTextArea={setSwitchTextArea}
                      handleSendMessage={handleSendMessage}
                    />
                  )}
                  <div className="flex flex-nowrap self-end">
                    {!sendDisable && input.length > 0 ? (
                      <button
                        disabled={sendDisable}
                        className={`p-2 cursor-pointer bg-pri text-black fill-black ${sendDisable && "bg-borderhl text-black"}  rounded-full`}
                        onClick={handleSendMessage}
                      >
                        <IoSendSharp size={20} strokeWidth={3} />
                      </button>
                    ) : (
                      <div className="p-2 cursor-pointer mr-2">
                        <Mic strokeWidth={1.5} size={20} className="" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </article>
      {/* attachment */}
      {files && files.length > 0 && (
        <AttachmentSection
          files={files}
          setFiles={setFiles}
          handleSendMessage={handleSendMessage}
          loading={loading}
          activeTransferFiles={activeTransferFiles}
        />
      )}
    </section>
  );
}

const TextArea = ({
  input,
  setInput,
  setSwitchTextArea,
  handleSendMessage,
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setSwitchTextArea: React.Dispatch<React.SetStateAction<boolean>>;
  handleSendMessage: () => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (input && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, []);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  return (
    <textarea
      ref={textareaRef}
      value={input}
      name="text"
      id="messageInput"
      className="outline-none focus:outline-none w-full grow scrollbar-thin scrollbar-thumb-borderhl resize-none max-h-60"
      rows={1}
      onChange={(e) => {
        const textarea = e.target;
        setInput(textarea.value);
        textarea.style.height = "auto";
        const isMoreThanOneRow = textarea.scrollHeight > textarea.clientHeight;
        setSwitchTextArea(isMoreThanOneRow);
      }}
      placeholder={`Type a message`}
      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      }}
      autoFocus
    />
  );
};
export const renderFileIcon = (file: File, size?: number) => {
  const s = size ? size * 4 : 28;
  if (file.type === "application/pdf") {
    return (
      <FaFilePdf
        style={{ width: `${s}px`, height: `${s}px` }}
        className={`text-red-500`}
      />
    );
  }

  // Microsoft Word / Text Docs
  if (
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type.startsWith("text/")
  ) {
    return (
      <FileText
        style={{ width: `${s}px`, height: `${s}px` }}
        className="text-blue-500"
      />
    );
  }

  // Excel / Spreadsheets
  if (
    file.type === "application/vnd.ms-excel" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return (
      <FileSpreadsheet
        style={{ width: `${s}px`, height: `${s}px` }}
        className="text-green-600"
      />
    );
  }

  // Video
  if (file.type.startsWith("video")) {
    return (
      <SiVlcmediaplayer
        style={{ width: `${s}px`, height: `${s}px` }}
        className="text-orange-600"
      />
    );
  }
  // Audio
  if (file.type.startsWith("audio")) {
    return (
      <Headphones
        style={{ width: `${s}px`, height: `${s}px` }}
        className="text-pink-600"
      />
    );
  }

  // Default Fallback Icon
  return (
    <GenericFile
      style={{ width: `${s}px`, height: `${s}px` }}
      className="text-gray-400"
    />
  );
};
export const NoChatSelection = () => {
  const [phone, setPhone] = useState<boolean>(false);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhone((prev) => !prev);
    }, 2000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return (
    <section
      className={`${mainLayout.rightpart ? "w-full grow flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)]" : "hidden"}`}
    >
      <div className="w-87 rounded-2xl p-4 flex flex-col items-center bg-bgpri/25">
        <div className="w-50 h-35 mb-8">
          <svg
            xmlns="http://w3.org"
            viewBox="0 0 400 200"
            width="100%"
            height="100%"
          >
            <defs>
              <clipPath id="popup-clip">
                <rect x="110" y="44" width="220" height="144" rx="14" ry="14" />
              </clipPath>
            </defs>

            <g
              stroke="#0E1E14"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <rect
                x="80"
                y="65"
                width="216"
                height="135"
                rx="14"
                ry="14"
                fill="#E3F9EC"
              />

              <path
                d="M 60,200 L 340,200 C 340,200 335,216 320,216 L 80,216 C 65,216 60,200 60,200 Z"
                fill="#E3F9EC"
              />

              <path
                d="M 158,200 L 242,200 L 234,208 L 166,208 Z"
                fill="#BCEAD0"
              />
            </g>

            <rect
              x="110"
              y="44"
              width="220"
              height="144"
              rx="14"
              ry="14"
              fill="#FDF7F2"
              stroke="#0E1E14"
              strokeWidth="3.5"
            />

            <g clipPath="url(#popup-clip)">
              <rect
                x="110"
                y="44"
                width="72"
                height="144"
                fill="#20D663"
                stroke="#0E1E14"
                strokeWidth="3.5"
              />
              <path
                d="M 122,56 L 130,64 M 130,56 L 122,64"
                stroke="#0E1E14"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="126"
                y1="94"
                x2="168"
                y2="94"
                stroke="#0E1E14"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <line
                x1="126"
                y1="112"
                x2="168"
                y2="112"
                stroke="#0E1E14"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <line
                x1="126"
                y1="130"
                x2="168"
                y2="130"
                stroke="#0E1E14"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Centered phone handset icon */}
              <g
                className={`${phone ? "scale-50" : "scale-0"} translate-x-33 translate-y-12 transition-all`}
              >
                <path
                  d="M 207 75
     C 200 75 195 80 195 87
     C 195 111 211 135 229 153
     C 247 171 271 181 295 181
     C 302 181 307 176 307 169
     L 307 151
     C 307 144 303 140 296 140
     L 280 140
     C 275 140 271 143 268 148
     L 260 158
     C 244 151 230 137 222 121
     L 232 113
     C 237 110 240 106 240 101
     L 240 86
     C 240 79 236 75 229 75
     Z"
                  fill="#20D663"
                  stroke="#0E1E14"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
              {/* Centered video camera icon */}
              <g
                className={`${phone ? "scale-0" : "scale-70"} translate-x-25 translate-y-8 transition-all`}
                stroke="#0E1E14"
                strokeWidth="3.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                {/* Camera body */}
                <rect
                  x="183"
                  y="91"
                  width="58"
                  height="48"
                  rx="8"
                  fill="#20D663"
                />

                {/* Camera lens / side */}
                <path
                  d="M 241 104 L 263 91 Q 268 89 268 96 L 268 134 Q 268 141 263 138 L 241 126 Z"
                  fill="#20D663"
                />
              </g>
            </g>
          </svg>
        </div>
        <p className="text-xl text-center">
          Voice and video calling is now available
        </p>
        <small className="text-txpri/75 text-[14px] text-center mt-1">
          Now you can make and join calls on WhatsApp Web.
        </small>
        <button className="bg-pri/50 rounded-full py-1 px-3 text-sm font-medium tracking-tighter mt-6 cursor-pointer">
          Go to Calls
        </button>
      </div>
      <div className="w-87 mt-6 flex gap-1 justify-between">
        {[
          { name: "Send Document", icon: FileText },
          { name: "Add Contact", icon: UserPlus },
          { name: "New Call", icon: Phone },
          { name: "Ask AI", icon: Bot },
        ].map((item, i) => (
          <div
            key={`noselection/right/icon/${i}`}
            className="flex flex-col justify-center items-center gap-1"
          >
            <div className="hover:bg-borderhl/75 active:bg-borderhl/75 bg-borderhl/40 rounded-full py-3 px-4 cursor-pointer transition-all">
              <item.icon className="" size={20} />
            </div>
            <small>{item.name}</small>
          </div>
        ))}
      </div>
    </section>
  );
};
