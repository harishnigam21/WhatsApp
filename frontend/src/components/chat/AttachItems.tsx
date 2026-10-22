import { useAppDispatch } from "@/redux/Store";
import {
  CalendarDays,
  Camera,
  FileText,
  Headphones,
  Images,
  UserRound,
} from "lucide-react";
import React, { useEffect, useRef } from "react";

export default function AttachItems({
  files,
  setShowAttachOptions,
  showAttachOptions,
  setFiles,
}: {
  files: { file: File; URL: string; message: string }[];
  showAttachOptions: boolean;
  setShowAttachOptions: React.Dispatch<React.SetStateAction<boolean>>;
  setFiles: React.Dispatch<
    React.SetStateAction<{ file: File; URL: string; message: string }[]>
  >;
}) {
  const attachRef = useRef<HTMLOListElement>(null);
  const dispatch = useAppDispatch();
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        attachRef.current &&
        !attachRef.current.contains(event.target as Node)
      ) {
        setShowAttachOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (showAttachOptions) {
    return (
      <ol
        ref={attachRef}
        className="absolute bottom-1 left-0 bg-[color-mix(in_srgb,var(--color-bgpri)_60%,var(--color-bgsec)_100%)] border border-borderhl/40 rounded-xl flex flex-col p-1"
      >
        {[
          {
            name: "Document",
            icon: FileText,
            color: "#7f66ff",
            input: {
              mutiple: true,
              accept:
                ".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx,application/*",
            },
            onClick: () => {},
          },
          {
            name: "Photos & videos",
            icon: Images,
            color: "#007bfc",
            input: {
              mutiple: true,
              accept: "image/*,video/*",
            },
            onClick: () => {},
          },
          {
            name: "Camera",
            icon: Camera,
            color: "#ff2e74",
            input: {
              mutiple: false,
              accept: "image/*",
            },
            onClick: () => {},
          },
          {
            name: "Audio",
            icon: Headphones,
            color: "#fa6533",
            input: {
              mutiple: false,
              accept: "audio/*",
            },
            onClick: () => {},
          },
          {
            name: "Contact",
            icon: UserRound,
            color: "#009de2",
            onClick: () => {},
          },
          {
            name: "Event",
            icon: CalendarDays,
            color: "#ff2e74",
            onClick: () => {},
          },
        ].map((item, i) => (
          <li
            key={`attach/list/item/${i}`}
            className=" rounded-xl hover:bg-bgsec active:bg-bgsec transition-all"
          >
            <label
              className="flex flex-nowrap items-center px-3 py-2 gap-3 cursor-pointer"
              htmlFor={item.name.toLowerCase()}
            >
              <div>
                <item.icon size={18} color={item.color} />
              </div>
              <p className="text-[14px]">{item.name}</p>
            </label>
            {item.input && (
              <input
                type="file"
                name={item.name.toLowerCase()}
                id={item.name.toLowerCase()}
                className="hidden"
                accept={item.input.accept}
                multiple={item.input.mutiple}
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
            )}
          </li>
        ))}
      </ol>
    );
  }
}
