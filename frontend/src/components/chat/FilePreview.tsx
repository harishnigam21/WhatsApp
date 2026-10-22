import React, { SetStateAction } from "react";
import WordViewer from "./WordViewer";
import { X } from "lucide-react";

export interface FileItem {
  name: string;
  type: string;
  blobUrl: string;
}

interface FilePreviewProps {
  item: FileItem;
  setSelectedFile: React.Dispatch<SetStateAction<FileItem | null>>;
}

export default function FilePreview({
  item,
  setSelectedFile,
}: FilePreviewProps) {
  return (
    <div className="bg-bgsec w-full max-w-4xl h-[85vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
      {/* Modal Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-borderhl bg-bgpri/10">
        <h3 className="font-semibold text-lg truncate">{item.name}</h3>
        <X
          color="red"
          onClick={() => setSelectedFile(null)}
          className="cursor-pointer"
        />
      </div>

      {/* Modal Body / Viewer */}
      {item.type.toLowerCase().includes("pdf") ? (
        <iframe
          src={`${item.blobUrl}#view=FitH`}
          className="w-full h-full"
          title={item.name}
        />
      ) : (
        <div className="text-center flex flex-col justify-center-safe items-center-safe grow">
          <p className="text-txpri/70 mb-4">
            Preview not available for this file type.
          </p>
          <a
            href={item.blobUrl}
            download={item.name}
            className="bg-pri font-medium px-4 py-2 rounded-lg"
          >
            Download File
          </a>
        </div>
      )}
    </div>
  );
}
