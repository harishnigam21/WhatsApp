import Image from "next/image";
import React, { useState } from "react";
import { renderFileIcon } from "../main/RightPart";
import { EllipsisVertical, X } from "lucide-react";
import { formatBytes } from "@/utils/formatBytes";
export interface FileItemType {
  name: string;
  type: string;
  blobUrl: string;
  thumbnail: string | null;
  size: number;
  message?: string;
}
export default function AttachmentPreview({
  selectedFile,
  setSelectedFile,
}: {
  selectedFile: FileItemType[];
  setSelectedFile: React.Dispatch<React.SetStateAction<FileItemType[] | null>>;
}) {
  const [selected, setSelected] = useState<FileItemType>(selectedFile[0]);
  return (
    <div className="relative bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] w-full h-full border-t border-borderhl/30 flex flex-col justify-between">
      <div className="grow flex flex-col items-center justify-center gap-2 overflow-hidden">
        <div className="flex flex-nowrap justify-between gap-4 items-center w-full px-1 sm:px-3">
          <div
            className="cursor-pointer"
            onClick={() => {
              setSelectedFile(null);
            }}
          >
            <X size={24} color="white" strokeWidth={1} />
          </div>
          <p className="my-4 font-medium text-sm break-all line-clamp-1 p-1 grow text-center">
            {selected.name}
          </p>
          <div className="cursor-pointer">
            <EllipsisVertical size={24} color="white" strokeWidth={1} />
          </div>
        </div>
        <div className=" flex items-center justify-center w-full grow max-h-full overflow-hidden">
          <FilePreview item={selected} />
        </div>
        {selected.message && (
          <p className="bg-bgsec/40 rounded-md my-3 py-1 px-3">
            {selected.message}
          </p>
        )}
      </div>
      <div className="border-t border-borderhl/30 flex flex-nowrap  gap-4 w-full justify-center p-4">
        <div className="flex gap-2 flex-nowrap items-center justify-center-safe grow w-full overflow-x-auto scrollbar-none">
          {selectedFile.map((item, i) => (
            <FilePreviewBox
              key={`attached/item/previewAfter/${i}`}
              item={item}
              selected={selected}
              setSelected={setSelected}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const FilePreviewBox = ({
  item,
  selected,
  setSelected,
}: {
  item: FileItemType;
  selected: FileItemType;
  setSelected: React.Dispatch<React.SetStateAction<FileItemType>>;
}) => {
  return (
    <div
      title={item.name}
      className={`max-w-15 min-w-15 max-h-15 min-h-15 relative flex items-center justify-center rounded-lg ${item.blobUrl == selected.blobUrl ? "border-3 border-pri" : "border-3 border-borderhl/30"} overflow-hidden cursor-pointer`}
      onClick={() => setSelected(item)}
    >
      {item.type.startsWith("image/") ? (
        <Image
          src={item.blobUrl || item.thumbnail!}
          alt="no preview"
          width={5}
          height={5}
          className="size-full object-cover object-center"
        />
      ) : (
        renderFileIcon(item as unknown as File)
      )}
    </div>
  );
};

export const FilePreview = ({ item }: { item: FileItemType }) => {
  return item ? (
    item?.type.startsWith("image/") ? (
      <div className="overflow-hidden relative w-full h-full flex items-center-safe justify-center-safe">
        <Image
          src={item.blobUrl}
          alt="item file"
          loading="lazy"
          width={10}
          height={10}
          className="w-fit h-fit max-w-full max-h-full min-w-20 object-contain object-center p-2 aspect-square"
        />
      </div>
    ) : item?.type.toLowerCase().includes("pdf") ? (
      <iframe
        src={`${item.blobUrl}#view=FitH`}
        className="w-[98%] sm:w-9/10 lg:w-6/10 h-full"
        title={item.name}
      />
    ) : item?.type.startsWith("video") ? (
      <div className="relative w-full h-full overflow-hidden flex items-center-safe justify-center-safe p-2">
        <video
          key={item.blobUrl}
          controls
          playsInline
          muted
          controlsList="nodownload noplaybackrate foobar"
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src={item.blobUrl} />
          Your browser does not support the video tag.
        </video>
      </div>
    ) : item?.type.startsWith("audio") ? (
      <div className="relative w-full h-full overflow-hidden flex items-center-safe justify-center-safe p-2">
        <video
          key={item.blobUrl}
          controls
          playsInline
          muted
          controlsList="nodownload noplaybackrate foobar"
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src={item.blobUrl} />
          Your browser does not support the video tag.
        </video>
      </div>
    ) : (
      <div className="flex flex-col justify-center items-center gap-1 bg-[#111b21] rounded-xl p-4 w-100 h-60 overflow-hidden m-2">
        {renderFileIcon(item as unknown as File, 20)}
        <p className="text-xl mt-6 font-medium text-white/80 text-center">
          No preview available
        </p>
        <p className="text-white/80 whitespace-nowrap">
          <span>{formatBytes(item.size)}</span>
          <span className="mx-2">-</span>
          <span className="uppercase">{item.name.split(".").slice(-1)}</span>
        </p>
      </div>
    )
  ) : (
    <strong className="text-red-500 text-sm">No file selected !</strong>
  );
};
