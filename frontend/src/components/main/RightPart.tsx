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
  Search,
  UserPlus,
  Video,
  File as GenericFile,
  Headphones,
  ArrowLeft,
  X,
  Star,
  Trash,
  Forward,
  Download,
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
  clearSelectionFor,
  MessageType,
  setCachedUrls,
  setSelectedFor,
  setSelectionFor,
} from "@/redux/slices/ChatSlice";
import AttachmentSection from "./AttachmentSection";
import { cleanupOldMedia, saveToDB } from "@/utils/indexedDB";
import toast from "react-hot-toast";
import { SiVlcmediaplayer } from "react-icons/si";
import { updateMainLayout } from "@/redux/slices/LayoutSlice";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/utils/formatBytes";
import RightPartMenu from "./RightPartMenu";
import Loading from "@/app/(main)/loading";

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
  const MessageAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTransferFiles, setActiveTransferFiles] = useState<
    Record<
      string,
      { status: "start" | "loading" | "stop" | "error"; progress: number }
    >
  >({});
  const dispatch = useAppDispatch();
  const router = useRouter();
  const handleSendMessage = async () => {
    const attachmentSize: number =
      Number(process.env.NEXT_PUBLIC_ATTACHMENT_SIZE) || 10485760;
    const overSizeFile = files.filter(
      (file) => file.file.size > attachmentSize,
    );
    if (overSizeFile && overSizeFile.length > 0) {
      toast.error(`No file should be more than ${formatBytes(attachmentSize)}`);
      return;
    }

    type UploadPayloadResponse = {
      success: boolean;
      signature: string;
      timestamp: string | number;
      apiKey: string;
      cloudName: string;
      folder: string;
      publicId: string;
      message?: string;
      eval: string;
    };

    type CloudinaryUploadResponse = {
      secure_url: string;
      public_id: string;
      resource_type: string;
      format: string;
      original_filename?: string;
      created_at: string;
      bytes: number;
      tags?: string[];
    };

    type FileMessageResponse = {
      success: boolean;
      message?: string;
      messageData?: MessageType;
      extraData?: {
        senderDetail: {
          _id: string;
          name: string;
          pic: string;
          lastSeen: Date;
        };
        receiverDetail: {
          _id: string;
          name: string;
          pic: string;
          lastSeen: Date;
        };
      };
      parent?: string;
    };

    const emitWithAck = <T,>(event: string, payload: unknown): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        if (!socket?.connected) {
          reject(new Error("Socket is not connected."));
          return;
        }

        socket.emit(event, payload, (err: Error | null, response: T) => {
          if (err) {
            reject(err);
            return;
          }

          if (!response) {
            reject(new Error(`No response received for ${event}.`));
            return;
          }

          resolve(response);
        });
      });
    };

    const uploadToCloudinary = (
      file: File,
      credentials: {
        cloudName: string;
        apiKey: string;
        timestamp: string;
        signature: string;
        folder: string;
        publicId: string;
        eval: string;
      },
      onProgress: (percentage: number) => void,
    ): Promise<any> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", credentials.apiKey);
        formData.append("timestamp", credentials.timestamp);
        formData.append("signature", credentials.signature);
        formData.append("folder", credentials.folder);
        formData.append("public_id", credentials.publicId);
        formData.append("eval", credentials.eval);
        formData.append("tags", "status_pending");

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);

            onProgress(percentage);
          }
        });

        xhr.addEventListener("load", () => {
          let response: any;

          try {
            response = JSON.parse(xhr.responseText);
          } catch {
            reject(new Error("Invalid Cloudinary response."));
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve(response);
          } else {
            reject(
              new Error(
                response?.error?.message ?? "Cloudinary upload failed.",
              ),
            );
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during Cloudinary upload."));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Cloudinary upload was cancelled."));
        });

        xhr.addEventListener("timeout", () => {
          reject(new Error("Cloudinary upload timed out."));
        });

        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`,
        );

        xhr.timeout = 0;
        xhr.send(formData);
      });
    };

    const uploadOneFile = async (
      file: (typeof files)[number],
      currentParent: string | null,
      changeParent: (id: string | null) => void,
    ) => {
      setActiveTransferFiles((prev) => ({
        ...prev,
        [file.URL]: { status: "loading", progress: 0 },
      }));

      try {
        // 1. Request signed upload credentials.
        const credentials = await emitWithAck<UploadPayloadResponse>(
          "request-file-payload",
          {
            name: file.file.name,
            receiver: selectedContact?._id,
            size: file.file.size,
          },
        );
        if (!credentials.success) {
          throw new Error(
            credentials.message ?? "Could not prepare the upload.",
          );
        }

        const cloudinaryData = await uploadToCloudinary(
          file.file,
          {
            cloudName: credentials.cloudName,
            apiKey: credentials.apiKey,
            timestamp: String(credentials.timestamp),
            signature: credentials.signature,
            folder: credentials.folder,
            publicId: credentials.publicId,
            eval: credentials.eval,
          },
          (percentage) => {
            setActiveTransferFiles((prev) => ({
              ...prev,
              [file.URL]: {
                status: "loading",
                progress: percentage,
              },
            }));
          },
        );

        const data = cloudinaryData as CloudinaryUploadResponse;

        // 3. Prepare thumbnail and persist the original file.
        const thumbnail =
          data.resource_type === "image"
            ? data.secure_url.replace(
                "/upload/",
                "/upload/e_blur:1000,q_10,w_200/",
              )
            : null;
        await cleanupOldMedia();
        dispatch(
          setCachedUrls({
            [data.secure_url]: file.URL,
          }),
        );
        await saveToDB(
          data.secure_url,
          new Blob([file.file], { type: file.file.type }),
        );
        // 4. Create the message on the backend.
        // Send metadata, not the file buffer again.
        const toUpload = {
          sender_id: userId,
          receiver_id: selectedContact!._id,
          parent: currentParent,
          message: file.message,
          url: data.secure_url,
          thumbnail,
          public_id: data.public_id,
          type: file.file.type,
          resource_type: data.resource_type,
          format: data.format,
          name: data.original_filename ?? file.file.name,
          created_at: data.created_at,
          size: data.bytes,
          tags: data.tags ?? [],
        };
        const messageResponse = await emitWithAck<FileMessageResponse>(
          "upload-file",
          toUpload,
        );
        if (!messageResponse.success) {
          throw new Error(
            messageResponse.message ?? "Could not create the message.",
          );
        }

        // 5. Update Redux only after message creation succeeds.
        if (messageResponse.messageData && messageResponse.extraData) {
          changeParent(messageResponse?.parent || null);
          dispatch(
            addSenderMessage({
              data: messageResponse.messageData,
              extra: messageResponse.extraData,
            }),
          );
        }

        setActiveTransferFiles((prev) => ({
          ...prev,
          [file.URL]: { status: "stop", progress: 100 },
        }));

        return messageResponse;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed.";
        setActiveTransferFiles((prev) => ({
          ...prev,
          [file.URL]: { ...prev[file.URL], status: "error" },
        }));
        toast.error(`${file.file.name}: ${message}`);
        throw error;
      }
    };

    try {
      setLoading(true);
      if (files?.length && selectedContact) {
        let currentParent = null;
        const changeParent = (id: string | null) => {
          currentParent = id;
        };
        for (const file of files) {
          try {
            await uploadOneFile(file, currentParent, changeParent);
          } catch (error) {
            // This allows the remaining files to continue uploading.
            console.error(`Failed to upload:`, error);
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
      setLoading(false);
      // files.forEach((item) => URL.revokeObjectURL(item.URL)); //not removing now
      setFiles([]);
    }
  };
  const [options, setOptions] = useState<boolean>(false);
  const { selectedFor, selectionFor } = useAppSelector((store) => store.chat);
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
              id="rightellipsis"
              className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all"
              onClick={() => {
                setOptions((prev) => !prev);
              }}
            >
              <EllipsisVertical className="size-5" />
            </div>
            {options && (
              <RightPartMenu optionItem={optionItem} setOptions={setOptions} />
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
            className="grow overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-borderhl h-10 flex flex-col justify-end-safe"
          >
            {children}
          </article>
          {/* input field */}
          {selectedFor ? (
            <div className="w-full py-5 px-3 flex items-center justify-between flex-nowrap bg-bgsec/90">
              <div className="flex flex-nowrap items-center gap-4">
                <button
                  className="cursor-pointer rounded-full p-2 hover:bg-borderhl/50 active:bg-borderhl/50 transition-all"
                  onClick={() => {
                    dispatch(setSelectedFor(false));
                    dispatch(clearSelectionFor());
                  }}
                >
                  <X size={20} />
                </button>
                <p className="mb-1">
                  <span>{selectionFor.length}</span>
                  <span className="pl-2">selected</span>
                </p>
              </div>
              <div className="flex flex-nowrap items-center gap-4">
                {[
                  { icon: Star, name: "Star" },
                  { icon: Trash, name: "Delete" },
                  { icon: Forward, name: "Forward" },
                  { icon: Download, name: "Download" },
                ].map((item, i) => (
                  <button
                    disabled={selectionFor.length == 0}
                    title={item.name}
                    key={`selected/perform/operation/${i}`}
                  >
                    <item.icon size={20} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
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
          )}
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight < 24 ? 24 : textareaRef.current.scrollHeight}px`;
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
        className="text-orange-600 "
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
  const [mounted, setMounted] = useState(false);
  const selectedContact = useAppSelector((store) => store.chat.selectedContact);
  if (selectedContact) {
    return null;
  }
  useEffect(() => {
    setMounted(true);

    const timer = setInterval(() => {
      setPhone((prev) => !prev);
    }, 2000);

    return () => clearInterval(timer);
  }, []);
  return (
    mounted && (
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
                  <rect
                    x="110"
                    y="44"
                    width="220"
                    height="144"
                    rx="14"
                    ry="14"
                  />
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
    )
  );
};
