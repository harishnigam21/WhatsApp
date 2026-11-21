import Image from "next/image";
import { renderFileIcon } from "./RightPart";
import { EllipsisVertical, LoaderCircle, Plus, X } from "lucide-react";
import { IoSendSharp } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/utils/formatBytes";
import { FilePreview } from "../chat/AttachmentPreview";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import {
  clearSelectedFileIndex,
  setSelectedFileIndex,
} from "@/redux/slices/ChatSlice";

export default function AttachmentSection({
  files,
  setFiles,
  handleSendMessage,
  loading,
  activeTransferFiles,
}: {
  files: { file: File; URL: string; message: string }[];
  setFiles: React.Dispatch<
    React.SetStateAction<{ file: File; URL: string; message: string }[]>
  >;
  loading: boolean;
  activeTransferFiles: Record<
    string,
    { status: "start" | "loading" | "stop" | "error"; progress: number }
  >;
  handleSendMessage: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState(files[0]);
  const selectedFileURL = useAppSelector(
    (store) => store.chat.selectedFileIndex,
  );
  const selectedFileIndex = selectedFileURL || files[0].URL;
  useEffect(() => {
    const getFile = files.find((item) => item.URL === selectedFileIndex);
    if (getFile) setSelectedFile(getFile);
  }, [selectedFileIndex]);
  const dispatch = useAppDispatch();
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sectionRef.current) return;
      const fileLength = files.length;
      const index = files.findIndex((item) => item.URL === selectedFile.URL);
      let toScrollIndex = index;

      if (event.key === "ArrowRight") {
        if (index + 1 <= fileLength - 1) {
          toScrollIndex = index + 1;
          dispatch(setSelectedFileIndex(files[index + 1].URL));
        } else {
          toScrollIndex = 0;
          dispatch(setSelectedFileIndex(files[0].URL));
        }
      } else if (event.key === "ArrowLeft") {
        if (index - 1 >= 0) {
          toScrollIndex = index - 1;
          dispatch(setSelectedFileIndex(files[index - 1].URL));
        } else {
          toScrollIndex = fileLength - 1;
          dispatch(setSelectedFileIndex(files[fileLength - 1].URL));
        }
      }
      const id = document.getElementById(
        `attached/item/preview/${toScrollIndex}`,
      );
      id?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, dispatch, selectedFile]);
  return (
    <div
      ref={sectionRef}
      className="absolute top-0 left-0 z-11 w-full h-full pt-15"
    >
      <div className="relative bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] w-full h-full border-t border-borderhl/30 flex flex-col justify-between">
        <div className="flex grow flex-col items-center justify-between gap-2 overflow-hidden">
          <div className="flex flex-nowrap justify-between gap-4 items-center w-full px-1 sm:px-3 my-4">
            <div
              className="cursor-pointer"
              onClick={() => {
                if (!loading) {
                  files.forEach((item) => URL.revokeObjectURL(item.URL));
                  setFiles([]);
                  dispatch(clearSelectedFileIndex());
                }
              }}
            >
              <X size={24} color="white" strokeWidth={1} />
            </div>
            <div className="relative flex items-center">
              <p className=" font-medium text-sm break-all line-clamp-1 p-1 grow text-center">
                {selectedFile.file.name}
              </p>
              <div className="rounded-full bg-green-500 text-black font-bold px-1 py-px flex items-center">
                <small className="text-[8px] whitespace-nowrap">
                  {formatBytes(selectedFile.file.size)}
                </small>
              </div>
            </div>
            <div className="cursor-pointer">
              <EllipsisVertical size={24} color="white" strokeWidth={1} />
            </div>
          </div>
          <div className="flex grow w-full items-center justify-center overflow-hidden">
            {selectedFile ? (
              <FilePreview
                item={{
                  name: selectedFile.file.name,
                  type: selectedFile.file.type,
                  blobUrl: selectedFile.URL,
                  thumbnail: selectedFile.URL,
                  size: selectedFile.file.size,
                }}
              />
            ) : (
              <strong className="text-red-500 text-sm">
                No file selected !
              </strong>
            )}
          </div>
          <div className="w-full md:w-7/10 lg:w-6/10 mb-2 px-4">
            <textarea
              value={selectedFile?.message}
              name="popupInputArea"
              id="popupInputArea"
              className="bg-borderhl/40 rounded-md w-full resize-none outline-none px-2 py-3"
              placeholder="Type a message"
              rows={1}
              autoFocus
              onChange={(e) => {
                setFiles((prev) =>
                  prev.map((item, i) => {
                    if (item.URL == selectedFileIndex) {
                      return { ...item, message: e.target.value };
                    } else {
                      return item;
                    }
                  }),
                );
              }}
            ></textarea>
          </div>
        </div>
        <div className="border-t border-borderhl/30 flex flex-nowrap  gap-4 w-full justify-center p-4">
          <div className="flex gap-2 flex-nowrap items-center justify-center-safe grow w-full overflow-x-auto scrollbar-none">
            {files.map((item, i) => (
              <FilePreviewBox
                key={`attached/item/preview/${i}`}
                item={item}
                setFiles={setFiles}
                loading={loading}
                activeTransferFiles={activeTransferFiles}
                selectedFileIndex={selectedFileIndex}
                first={files[0]}
                i={i}
              />
            ))}
            <label
              title="add more attachments"
              htmlFor="addmore"
              className={`max-w-15 min-w-15 max-h-15 min-h-15 flex items-center justify-center rounded-lg border border-borderhl overflow-hidden cursor-pointer`}
            >
              <Plus size={18} className="text-borderhl" />
            </label>
            <input
              disabled={loading}
              type="file"
              name="addmore"
              id="addmore"
              className="hidden"
              multiple
              onChange={(e) => {
                const cfiles = e.target.files;
                if (cfiles && cfiles.length > 0) {
                  const existingFile = files.map((Item) => Item.file.name);
                  const takfiles = Array.from(cfiles);
                  const toAdd = takfiles
                    .filter((item) => !existingFile.includes(item.name))
                    .map((item) => {
                      return {
                        file: item,
                        URL: URL.createObjectURL(item),
                        message: "",
                      };
                    });
                  setFiles((prev) => [...prev, ...toAdd]);
                }
              }}
            />
          </div>
          <button
            disabled={loading}
            className="relative flex items-center justify-center rounded-full w-15 h-15 bg-pri cursor-pointer"
            onClick={handleSendMessage}
          >
            {loading ? (
              <LoaderCircle size={30} color="white" className="animate-spin" />
            ) : (
              <IoSendSharp size={30} color="black" className="ml-1.5" />
            )}
            <div className="bg-white text-black font-thin rounded-full p-0.5 absolute top-0 right-0 size-5 flex items-center justify-center text-sm">
              {files.length}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

const FilePreviewBox = ({
  item,
  loading,
  setFiles,
  activeTransferFiles,
  selectedFileIndex,
  first,
  i,
}: {
  i: number;
  item: { file: File; URL: string; message: string };
  first: { file: File; URL: string; message: string };
  loading: boolean;
  setFiles: React.Dispatch<
    React.SetStateAction<{ file: File; URL: string; message: string }[]>
  >;
  activeTransferFiles: Record<
    string,
    { status: "start" | "loading" | "stop" | "error"; progress: number }
  >;
  selectedFileIndex: string;
}) => {
  const [progress, setProgress] = useState<number>(0);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const fileStatus = activeTransferFiles[item.URL];
    if (fileStatus) {
      setProgress(fileStatus.progress);
    }
  }, [activeTransferFiles]);

  return (
    <div
      id={`attached/item/preview/${i}`}
      title={item.file.name}
      className={`max-w-15 min-w-15 max-h-15 min-h-15 relative flex items-center justify-center rounded-lg ${item.URL == selectedFileIndex ? "border-3 border-pri" : "border-3 border-borderhl/30"} overflow-hidden cursor-pointer`}
      onClick={() => {
        dispatch(setSelectedFileIndex(item.URL));
        document.getElementById("popupInputArea")?.focus();
      }}
    >
      {item.file.type.startsWith("image/") ? (
        <Image
          src={item.URL}
          alt="no preview"
          width={5}
          height={5}
          className="size-full object-cover object-center"
        />
      ) : (
        renderFileIcon(item.file)
      )}
      {!loading && (
        <div
          title="remove"
          className="absolute top-0.5 right-0.5 size-4 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 active:scale-110 transition-all z-1"
          onClick={(e) => {
            e.stopPropagation();
            if (!loading) {
              URL.revokeObjectURL(item.URL);
              let to = first;
              setFiles((prev) =>
                prev.filter((file, i) => {
                  if (i > 0 && file.URL == item.URL) {
                    to = prev[i - 1];
                  }
                  if (i < prev.length - 1 && file.URL == item.URL) {
                    to = prev[i + 1];
                  }
                  return file.URL !== item.URL;
                }),
              );
              dispatch(setSelectedFileIndex(to.URL));
            }
          }}
        >
          <X strokeWidth={4} size={12} color="white" className="" />
        </div>
      )}
      <div className="absolute top-0 left-0 w-full h-full flex items-end">
        <div
          style={{ height: `${progress}%` }}
          className={`${activeTransferFiles[item.URL]?.status == "error" ? "bg-red-500/50" : "bg-blue-500/50"} w-full transition-all`}
        ></div>
      </div>
    </div>
  );
};
