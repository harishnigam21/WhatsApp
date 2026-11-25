import Image from "next/image";
import { renderFileIcon } from "./RightPart";
import { EllipsisVertical, LoaderCircle, Plus, X } from "lucide-react";
import { IoSendSharp } from "react-icons/io5";
import { useEffect, useRef } from "react";
import { formatBytes } from "@/utils/formatBytes";
import { FilePreview } from "../chat/AttachmentPreview";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import {
  clearSelectedFileIndex,
  setSelectedFileIndex,
} from "@/redux/slices/ChatSlice";

type Attachment = {
  file: File;
  URL: string;
  message: string;
};

type TransferFiles = Record<
  string,
  {
    status: "start" | "loading" | "stop" | "error";
    progress: number;
  }
>;

type AttachmentSectionProps = {
  files: Attachment[];
  setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>;
  handleSendMessage: () => void;
  loading: boolean;
  activeTransferFiles: TransferFiles;
};

export default function AttachmentSection({
  files,
  setFiles,
  handleSendMessage,
  loading,
  activeTransferFiles,
}: AttachmentSectionProps) {
  const dispatch = useAppDispatch();

  const sectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFileURL = useAppSelector(
    (store) => store.chat.selectedFileIndex,
  );

  // Always derive the selected file from the latest files array.
  const selectedFileIndex =
    files.findIndex((item) => item.URL === selectedFileURL) !== -1
      ? selectedFileURL
      : (files[0]?.URL ?? "");

  const selectedFile = files.find((item) => item.URL === selectedFileIndex);

  // Keep Redux selection synchronized with the attachments.
  useEffect(() => {
    if (files.length === 0) {
      if (selectedFileURL) {
        dispatch(clearSelectedFileIndex());
      }
      return;
    }

    if (!files.some((item) => item.URL === selectedFileURL)) {
      dispatch(setSelectedFileIndex(files[0].URL));
    }
  }, [files, selectedFileURL, dispatch]);

  // Keyboard navigation between attachments.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sectionRef.current || files.length <= 1) return;

      // Do not interfere with text inputs or editable elements.
      const target = event.target as HTMLElement;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();

      const currentIndex = files.findIndex(
        (item) => item.URL === selectedFileIndex,
      );

      const safeIndex = currentIndex === -1 ? 0 : currentIndex;

      const nextIndex =
        event.key === "ArrowRight"
          ? (safeIndex + 1) % files.length
          : (safeIndex - 1 + files.length) % files.length;

      const nextFile = files[nextIndex];

      dispatch(setSelectedFileIndex(nextFile.URL));

      document
        .getElementById(`attached/item/preview/${nextIndex}`)
        ?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [files, selectedFileIndex, dispatch]);

  // Close attachment section.
  const handleClose = () => {
    if (loading) return;

    files.forEach((item) => {
      URL.revokeObjectURL(item.URL);
    });

    setFiles([]);
    dispatch(clearSelectedFileIndex());
  };

  // Update the caption/message of the selected attachment.
  const handleMessageChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const message = event.target.value;

    setFiles((prev) =>
      prev.map((item) =>
        item.URL === selectedFileIndex ? { ...item, message } : item,
      ),
    );
  };

  // Add more attachments.
  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;

    if (!selectedFiles?.length) return;

    const existingFiles = new Set(
      files.map(
        (item) =>
          `${item.file.name}-${item.file.size}-${item.file.lastModified}`,
      ),
    );

    const newAttachments: Attachment[] = Array.from(selectedFiles)
      .filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;

        if (existingFiles.has(key)) return false;

        existingFiles.add(key);
        return true;
      })
      .map((file) => ({
        file,
        URL: URL.createObjectURL(file),
        message: "",
      }));

    if (newAttachments.length > 0) {
      setFiles((prev) => [...prev, ...newAttachments]);
    }

    // Allow selecting the same file again later.
    event.target.value = "";
  };

  return (
    <div
      ref={sectionRef}
      className="absolute top-0 left-0 z-11 w-full h-full pt-15"
    >
      <div className="relative bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] w-full h-full border-t border-borderhl/30 flex flex-col justify-between">
        {/* Main preview section */}
        <div className="flex grow flex-col items-center justify-between gap-2 overflow-hidden">
          {/* Header */}
          <div className="flex flex-nowrap justify-between gap-4 items-center w-full px-1 sm:px-3 my-4">
            <button
              type="button"
              disabled={loading}
              className="cursor-pointer disabled:opacity-40"
              onClick={handleClose}
            >
              <X size={24} color="white" strokeWidth={1} />
            </button>

            <div className="relative flex items-center min-w-0">
              <p className="font-medium text-sm break-all line-clamp-1 p-1 grow text-center">
                {selectedFile?.file.name ?? "No file selected"}
              </p>

              {selectedFile && (
                <div className="rounded-full bg-green-500 text-black font-bold px-1 py-px flex items-center shrink-0">
                  <small className="text-[8px] whitespace-nowrap">
                    {formatBytes(selectedFile.file.size)}
                  </small>
                </div>
              )}
            </div>

            <button
              type="button"
              className="cursor-pointer"
              title="More options"
            >
              <EllipsisVertical size={24} color="white" strokeWidth={1} />
            </button>
          </div>

          {/* File preview */}
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
                No file selected!
              </strong>
            )}
          </div>

          {/* Message input */}
          <div className="w-full md:w-7/10 lg:w-6/10 mb-2 px-4">
            <textarea
              value={selectedFile?.message ?? ""}
              name="popupInputArea"
              id="popupInputArea"
              disabled={!selectedFile || loading}
              className="bg-borderhl/40 rounded-md w-full resize-none outline-none px-2 py-3 disabled:opacity-50"
              placeholder="Type a message"
              rows={1}
              autoFocus
              onChange={handleMessageChange}
            />
          </div>
        </div>

        {/* Bottom attachment controls */}
        <div className="border-t border-borderhl/30 flex flex-nowrap gap-4 w-full justify-center p-4">
          {/* Attachment thumbnails */}
          <div className="flex gap-2 flex-nowrap items-center justify-center-safe grow w-full overflow-x-auto scrollbar-none">
            {files.map((item, i) => (
              <FilePreviewBox
                key={item.URL}
                item={item}
                loading={loading}
                activeTransferFiles={activeTransferFiles}
                selectedFileIndex={selectedFileIndex!}
                index={i}
                files={files}
                setFiles={setFiles}
              />
            ))}

            {/* Add more attachments */}
            <label
              title="Add more attachments"
              htmlFor="addmore"
              className={`max-w-15 min-w-15 max-h-15 min-h-15 flex items-center justify-center rounded-lg border border-borderhl overflow-hidden ${
                loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <Plus size={18} className="text-borderhl" />
            </label>

            <input
              ref={fileInputRef}
              disabled={loading}
              type="file"
              name="addmore"
              id="addmore"
              className="hidden"
              multiple
              onChange={handleAddFiles}
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            disabled={loading || files.length === 0}
            className="relative flex items-center justify-center rounded-full w-15 h-15 bg-pri cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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

// --------------------------------------------------
// Attachment thumbnail
// --------------------------------------------------

const FilePreviewBox = ({
  item,
  loading,
  activeTransferFiles,
  selectedFileIndex,
  index,
  files,
  setFiles,
}: {
  item: Attachment;
  loading: boolean;
  activeTransferFiles: TransferFiles;
  selectedFileIndex: string;
  index: number;
  files: Attachment[];
  setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>;
}) => {
  const dispatch = useAppDispatch();

  const transfer = activeTransferFiles[item.URL];
  const progress = transfer?.progress ?? 0;

  const isSelected = item.URL === selectedFileIndex;
  const isError = transfer?.status === "error";

  // Remove an attachment and select a valid neighboring attachment.
  const handleRemove = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (loading) return;

    const currentIndex = files.findIndex((file) => file.URL === item.URL);

    if (currentIndex === -1) return;

    const isRemovingSelected = isSelected;

    let nextSelectedURL = selectedFileIndex;

    if (isRemovingSelected) {
      const nextFile = files[currentIndex + 1] ?? files[currentIndex - 1];

      nextSelectedURL = nextFile?.URL ?? "";
    }

    URL.revokeObjectURL(item.URL);

    setFiles((prev) => prev.filter((file) => file.URL !== item.URL));

    if (isRemovingSelected) {
      if (nextSelectedURL) {
        dispatch(setSelectedFileIndex(nextSelectedURL));
      } else {
        dispatch(clearSelectedFileIndex());
      }
    }
  };

  return (
    <div
      id={`attached/item/preview/${index}`}
      title={item.file.name}
      className={`max-w-15 min-w-15 max-h-15 min-h-15 relative flex items-center justify-center rounded-lg ${
        isSelected ? "border-3 border-pri" : "border-3 border-borderhl/30"
      } overflow-hidden cursor-pointer`}
      onClick={() => {
        dispatch(setSelectedFileIndex(item.URL));

        document.getElementById("popupInputArea")?.focus();
      }}
    >
      {/* Thumbnail */}
      {item.file.type.startsWith("image/") ? (
        <Image
          src={item.URL}
          alt={item.file.name}
          width={60}
          height={60}
          unoptimized
          className="size-full object-cover object-center"
        />
      ) : (
        renderFileIcon(item.file)
      )}

      {/* Remove button */}
      {!loading && (
        <div
          title="Remove attachment"
          className="absolute top-0.5 right-0.5 size-4 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 active:scale-110 transition-all z-2"
          onClick={handleRemove}
        >
          <X strokeWidth={4} size={12} color="white" />
        </div>
      )}

      {/* Upload progress overlay */}
      {transfer && (
        <div className="absolute top-0 left-0 w-full h-full flex items-end pointer-events-none">
          <div
            style={{
              height: `${Math.min(100, Math.max(0, progress))}%`,
            }}
            className={`${
              isError ? "bg-red-500/50" : "bg-blue-500/50"
            } w-full transition-all`}
          />
        </div>
      )}
    </div>
  );
};
