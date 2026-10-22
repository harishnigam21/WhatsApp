import { ActiveContact } from "@/redux/slices/ChatSlice";
import { User } from "@/redux/slices/UserSlice";
import { shortTimestamp } from "@/utils/dateFormats";
import {
  Check,
  CheckCheck,
  ChevronDown,
  Paperclip,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ActiveContactListMenu from "./ActiveContactListMenu";
import { useAppSelector } from "@/redux/Store";

export default function ActiveContactList({
  item,
  user,
}: {
  item: ActiveContact;
  user: User | null;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<boolean>(false);
  const selectedContactID = useAppSelector(
    (store) => store.chat.selectedContact?._id,
  );
  return (
    <div
      className="px-2 w-full"
      onClick={() => {
        router.push(`/c=${item?._id}`);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setOptions((prev) => !prev);
      }}
    >
      <div
        className={`flex gap-3 px-2.5 py-3 rounded-xl cursor-pointer hover:bg-bgsec active:bg-bgsec ${(options || selectedContactID == item._id) && "bg-bgsec"} group transition-all`}
      >
        <div className="min-w-12 min-h-12 max-w-12 max-h-12 flex justify-center items-center rounded-full self-center border overflow-hidden">
          {item?.pic ? (
            <Image
              loading="eager"
              src={item.pic}
              width={10}
              height={10}
              alt="user pic"
              className="size-full object-cover object-center aspect-square"
            />
          ) : (
            <div className="size-full p-1 flex items-center justify-center uppercase font-bold">
              {item?.name.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center grow">
          <p className="break-all line-clamp-1">{item._id == user?._id ? "You" : item.name}</p>
          <div className="flex flex-nowrap items-center gap-1">
            {item.lastMessage.sender_id == user?._id && (
              <div>
                {item.lastMessage.seen == "unseen" ? (
                  <Check size={14} className="mt-1 text-txsec" />
                ) : item.lastMessage.seen == "seen" ? (
                  <CheckCheck size={14} className="mt-1 text-blue-500" />
                ) : (
                  <CheckCheck size={14} className="mt-1 text-txsec" />
                )}
              </div>
            )}
            <small className="text-txpri/75 break-all line-clamp-1 flex items-center">
              {item.lastMessage.attachments &&
                item.lastMessage.attachments.length > 0 && (
                  <Paperclip size={16} className="mt-1" />
                )}
              {item.lastMessage.content}
            </small>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <small
            className={`${item.unread > 0 ? "text-pri" : "text-txpri/75"} whitespace-nowrap`}
          >
            {shortTimestamp(item.lastMessage.createdAt)}
          </small>
          <div className="flex items-center self-end gap-2">
            {item.unread > 0 && (
              <div className="size-5 rounded-full flex justify-center items-center p-1 bg-pri font-bold text-black">
                <small>{item.unread}</small>
              </div>
            )}
            <div
              className={`${options ? "flex" : "hidden"} group-hover:flex items-center relative`}
            >
              <ChevronDown
                size={14}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setOptions((prev) => !prev);
                }}
              />
              {options && <ActiveContactListMenu setOptions={setOptions} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
