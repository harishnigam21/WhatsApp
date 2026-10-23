import Image from "next/image";
import { renderFileIcon } from "../main/RightPart";
import { AttachmentType, setCachedUrls } from "@/redux/slices/ChatSlice";
import { useEffect, useState } from "react";
import { cleanupOldMedia, getFromDB, saveToDB } from "@/utils/indexedDB";
import { formatBytes } from "@/utils/formatBytes";
import { ArrowDown, LoaderCircle } from "lucide-react";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import AttachmentPreview, { FileItemType } from "./AttachmentPreview";

export default function AttachmentGrid({
  attachment,
  attachmentLength,
  sectionWidth,
}: {
  attachment: AttachmentType[];
  attachmentLength: number;
  sectionWidth: number;
}) {
  const gridColCalculate = attachmentLength > 2 ? 2 : attachmentLength;
  const [URLtoDownload, setURLToDownload] = useState<string[]>([]);
  const [toDownload, setToDownload] = useState<number>(0);
  const [download, setDownload] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItemType[] | null>(null);
  const [ABS, setABS] = useState<number>(0); //Attachment block size
  const cachedUrls = useAppSelector((store) => store.chat.cachedUrls);
  const dispatch = useAppDispatch();
  const handleDownload = async () => {
    if (URLtoDownload.length === 0 || download) return;
    const originalSizeBackup = toDownload;
    try {
      setDownload(true);
      const downloadPromises = URLtoDownload.map(async (itemUrl) => {
        let nextLocalUrl;
        let sizeInBytes = 0;
        const cached = await getFromDB(itemUrl);
        if (cached) {
          nextLocalUrl = URL.createObjectURL(cached.blob);
          sizeInBytes = cached.blob.size;
        } else {
          const res = await axios.get(itemUrl, {
            responseType: "blob",
          });
          const downloadedBlob: Blob = res.data;
          sizeInBytes = downloadedBlob.size;
          await saveToDB(itemUrl, downloadedBlob);
          nextLocalUrl = URL.createObjectURL(downloadedBlob);
        }
        // Safely update state maps using functional state changes
        dispatch(
          setCachedUrls({
            [itemUrl]: nextLocalUrl,
          }),
        );

        // Track remaining download size meters reactively
        setToDownload((prev) => (prev > sizeInBytes ? prev - sizeInBytes : 0));
        setURLToDownload((prevList) =>
          prevList.filter((url) => url !== itemUrl),
        );
      });

      // Process concurrent files simultaneously
      await Promise.all(downloadPromises);
      await cleanupOldMedia();
    } catch (error) {
      console.error("Batch download loop failed:", error);
      setToDownload(originalSizeBackup); // Restore meter sizes on structural crash
    } finally {
      setDownload(false);
    }
  };
  useEffect(() => {
    const maxSize = (sectionWidth * (50 / 100)) / 2;
    if (attachment.length == 1) {
      const te = sectionWidth * (50 / 100);
      setABS(te > 300 ? 300 : te);
    } else {
      setABS(maxSize > 150 ? 150 : maxSize);
    }
  }, [sectionWidth, attachment]);
  useEffect(() => {
    let isMounted = true;
    const urlsToCleanup: string[] = [];
    const initializeMediaCache = async () => {
      let accumulatedDownloadSize = 0;
      const outstandingDownloads: string[] = [];
      const locallyFoundMap = new Map<string, string>();
      await Promise.all(
        attachment.map(async (item) => {
          const cached = await getFromDB(item.url);
          if (!cached) {
            accumulatedDownloadSize += item.size;
            outstandingDownloads.push(item.url);
          } else {
            const objectUrl = URL.createObjectURL(cached.blob);
            urlsToCleanup.push(objectUrl);
            locallyFoundMap.set(item.url, objectUrl);
          }
        }),
      );

      // Batch all updates precisely into one render tick
      if (isMounted) {
        setToDownload(accumulatedDownloadSize);
        setURLToDownload(outstandingDownloads);
        dispatch(setCachedUrls(Object.fromEntries(locallyFoundMap)));
      }
    };

    initializeMediaCache();

    // ✅ FIXED: Memory cleanup loop prevents fatal browser memory leaks
    return () => {
      isMounted = false;
      urlsToCleanup.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachment]);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridColCalculate},1fr)`,
      }}
      className={`w-full p-1 gap-1 relative`}
    >
      {attachment.map((item, i) => (
        <div
          title={item.message}
          className="relative cursor-pointer w-full overflow-hidden"
          key={`message/attachment/${item._id}`}
        >
          {i < 4 &&
            (item.resource_type == "image" && item.type.startsWith("image") ? (
              <div
                style={{ width: `${ABS}px`, height: `${ABS}px` }}
                className={` relative flex items-center justify-center overflow-hidden`}
                onClick={() => {
                  const exist = cachedUrls[item.url];
                  if (exist) {
                    setSelectedFile([
                      {
                        blobUrl: exist,
                        name: item.name,
                        type: item.type,
                        thumbnail: item.thumbnail,
                        size: item.size,
                        message: item.message,
                      },
                    ]);
                  }
                }}
              >
                <Image
                  src={cachedUrls[item.url] || item.thumbnail!}
                  alt="refresh"
                  loading="lazy"
                  width={10}
                  height={10}
                  className="w-full h-full object-cover object-center rounded-lg"
                />
              </div>
            ) : (
              <div
                style={{ width: `${ABS}px`, height: `${ABS}px` }}
                className={`flex items-center justify-center rounded-lg`}
              >
                <div
                  className="bg-bgsec/30 rounded-lg w-full h-full flex items-center justify-center p-2"
                  onClick={() => {
                    const exist = cachedUrls[item.url];
                    if (exist) {
                      setSelectedFile([
                        {
                          blobUrl: exist,
                          name: item.name,
                          type: item.type,
                          thumbnail: item.thumbnail,
                          size: item.size,
                          message: item.message,
                        },
                      ]);
                    }
                  }}
                >
                  {renderFileIcon({ type: item.type } as File)}
                </div>
              </div>
            ))}
          {i == 3 && attachmentLength > 4 && (
            <div
              style={{ width: `${ABS}px`, height: `${ABS}px` }}
              className={` absolute top-0 left-0 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur font-bold cursor-e-resize`}
              onClick={() => {
                const items = attachment.reduce<FileItemType[]>((acc, item) => {
                  const cachedUrl = cachedUrls[item.url];
                  if (cachedUrl) {
                    acc.push({
                      blobUrl: cachedUrl,
                      name: item.name,
                      type: item.type,
                      thumbnail: item.thumbnail,
                      size: item.size,
                      message: item.message,
                    });
                  }
                  return acc;
                }, []);
                setSelectedFile(items);
              }}
            >
              {attachmentLength - 3}+
            </div>
          )}
        </div>
      ))}
      {toDownload > 0 && (
        <div className="w-full h-full absolute top-0 left-0 backdrop-blur-xs flex items-center justify-center">
          <div
            className="py-1 px-3 rounded-full bg-bgsec/70 text-txpri font-medium flex flex-col justify-center items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
          >
            <small>{formatBytes(toDownload)}</small>
            {download ? (
              <LoaderCircle className="animate-spin" size={14} />
            ) : (
              <ArrowDown size={14} />
            )}
          </div>
        </div>
      )}
      {selectedFile && (
        <div className="w-screen h-screen fixed top-0 left-0 z-50 flex items-center-safe justify-center-safe">
          <AttachmentPreview
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        </div>
      )}
    </div>
  );
}
