import Image from "next/image";
import { renderFileIcon } from "./RightPart";
import { EllipsisVertical, LoaderCircle, Plus, X } from "lucide-react";
import { IoSendSharp } from "react-icons/io5";
import { useEffect, useState } from "react";
import { formatBytes } from "@/utils/formatBytes";
import { FilePreview } from "../chat/AttachmentPreview";

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
  activeTransferFiles: Record<string, "start" | "loading" | "stop" | "error">;
  handleSendMessage: () => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<number>(0);

  return (
    <div className="absolute top-0 left-0 z-11 w-full h-full pt-15">
      <div className="relative bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] w-full h-full border-t border-borderhl/30 flex flex-col justify-between">
        <div className="flex grow flex-col items-center justify-between gap-2 overflow-hidden">
          <div className="flex flex-nowrap justify-between gap-4 items-center w-full px-1 sm:px-3">
            <div
              className="cursor-pointer"
              onClick={() => {
                if (!loading) {
                  files.forEach((item) => URL.revokeObjectURL(item.URL));
                  setFiles([]);
                }
              }}
            >
              <X size={24} color="white" strokeWidth={1} />
            </div>
            <p className="my-4 font-medium text-sm break-all line-clamp-1 p-1 grow text-center">
              {files[selectedFiles]?.file.name}
            </p>
            <div className="cursor-pointer">
              <EllipsisVertical size={24} color="white" strokeWidth={1} />
            </div>
          </div>
          <div className="flex grow w-full items-center justify-center overflow-hidden">
            {files[selectedFiles] ? (
              <FilePreview
                item={{
                  name: files[selectedFiles].file.name,
                  type: files[selectedFiles].file.type,
                  blobUrl: files[selectedFiles].URL,
                  thumbnail: files[selectedFiles].URL,
                  size: files[selectedFiles].file.size,
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
              value={files[selectedFiles]?.message}
              name="popupInputArea"
              id="popupInputArea"
              className="bg-borderhl/40 rounded-md w-full resize-none outline-none px-2 py-3"
              placeholder="Type a message"
              rows={1}
              onChange={(e) => {
                setFiles((prev) =>
                  prev.map((item, i) => {
                    if (i == selectedFiles) {
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
                i={i}
                item={item}
                setFiles={setFiles}
                loading={loading}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                activeTransferFiles={activeTransferFiles}
              />
            ))}
            <label
              htmlFor="addmore"
              className={`max-w-15 min-w-15 max-h-15 min-h-15 flex items-center justify-center rounded-lg border border-borderhl overflow-hidden cursor-pointer`}
            >
              <Plus size={18} className="text-borderhl" />
            </label>
            <input
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
  setSelectedFiles,
  i,
  loading,
  setFiles,
  selectedFiles,
  activeTransferFiles,
}: {
  item: { file: File; URL: string; message: string };
  i: number;
  loading: boolean;
  setSelectedFiles: React.Dispatch<React.SetStateAction<number>>;
  setFiles: React.Dispatch<
    React.SetStateAction<{ file: File; URL: string; message: string }[]>
  >;
  selectedFiles: number;
  activeTransferFiles: Record<string, "start" | "loading" | "stop" | "error">;
}) => {
  const [progress, setProgress] = useState<number>(0);
  useEffect(() => {
    const fileStatus = activeTransferFiles[item.URL];
    if (!fileStatus) {
      setProgress(0);
      return;
    }
    if (fileStatus === "stop") {
      setProgress(100);
      return;
    }
    if (fileStatus === "start" || fileStatus === "loading") {
      setProgress((prev) => (prev >= 80 ? 0 : prev));
      const progressing = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            return prev;
          }
          return prev + 5;
        });
      }, 600);
      return () => clearInterval(progressing);
    }
  }, [activeTransferFiles]);
  return (
    <div
      title={item.file.name}
      className={`max-w-15 min-w-15 max-h-15 min-h-15 relative flex items-center justify-center rounded-lg ${i == selectedFiles ? "border-3 border-pri" : "border-3 border-borderhl/30"} overflow-hidden cursor-pointer`}
      onClick={() => setSelectedFiles(i)}
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
          onClick={() => {
            if (!loading) {
              URL.revokeObjectURL(item.URL);
              setFiles((prev) => prev.filter((file) => file.URL !== item.URL));
            }
          }}
        >
          <X strokeWidth={4} size={12} color="white" className="" />
        </div>
      )}
      <div className="absolute top-0 left-0 w-full h-full flex items-end">
        <div
          style={{ height: `${progress}%` }}
          className="bg-blue-500/50 w-full transition-all"
        ></div>
      </div>
    </div>
  );
};
