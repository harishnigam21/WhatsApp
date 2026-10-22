import Image from "next/image";
import { renderFileIcon } from "./RightPart";
import { LoaderCircle, Plus, X } from "lucide-react";
import { IoSendSharp } from "react-icons/io5";
import { useEffect, useState } from "react";
import { formatBytes } from "@/utils/formatBytes";

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
  activeTransferFiles: Map<string, "start" | "loading" | "stop" | "error">;
  handleSendMessage: () => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<number>(0);

  return (
    <div className="absolute top-0 left-0 w-full h-full pt-15">
      <div className="relative bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] w-full h-full border-t border-borderhl/30 flex flex-col">
        <div className="grow flex flex-col items-center justify-center gap-2">
          <p className="my-4 font-medium text-sm">
            {files[selectedFiles]?.file.name}
          </p>
          <div className="grow flex items-center justify-center">
            {files[selectedFiles] ? (
              files[selectedFiles]?.file.type.startsWith("image/") ? (
                <Image
                  src={files[selectedFiles].URL}
                  alt="selected file"
                  width={10}
                  height={10}
                  className="w-fit max-w-50 max-h-50 object-contain object-center"
                />
              ) : (
                <div className="flex flex-col justify-center items-center gap-1 bg-[#111b21] rounded-xl p-4 w-100 h-60 overflow-hidden">
                  {renderFileIcon(files[selectedFiles].file, 20)}
                  <p className="text-xl mt-6 font-medium text-white/80 text-center">
                    No preview available
                  </p>
                  <p className="text-white/80 whitespace-nowrap">
                    <span>{formatBytes(files[selectedFiles].file.size)}</span>
                    <span className="mx-2">-</span>
                    <span className="uppercase">
                      {files[selectedFiles]?.file.name.split(".").slice(-1)}
                    </span>
                  </p>
                </div>
              )
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
        <X
          size={24}
          color="white"
          strokeWidth={1}
          className="absolute top-4 left-4 cursor-pointer"
          onClick={() => {
            if (!loading) {
              files.forEach((item) => URL.revokeObjectURL(item.URL));
              setFiles([]);
            }
          }}
        />
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
  activeTransferFiles: Map<string, "start" | "loading" | "stop" | "error">;
}) => {
  const [progress, setProgress] = useState<number>(0);
  useEffect(() => {
    const fileStatus = activeTransferFiles.get(item.URL);
    if (!fileStatus) {
      setProgress(0);
      return;
    }
    if (fileStatus === "stop") {
      setProgress(100);
      return;
    }
    if (fileStatus === "start") {
      setProgress((prev) => (prev >= 80 ? 0 : prev));
      const progressing = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            return prev;
          }
          return prev + 5;
        });
      }, 1000);
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
