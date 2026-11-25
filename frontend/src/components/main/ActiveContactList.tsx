import {
  ActiveContact,
  setSelectedContactLoading,
} from "@/redux/slices/ChatSlice";
import { User } from "@/redux/slices/UserSlice";
import { shortTimestamp } from "@/utils/dateFormats";
import { Check, CheckCheck, ChevronDown, Paperclip } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import ActiveContactListMenu from "./ActiveContactListMenu";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { validatePhoneNumber } from "@/utils/firebase";

function ActiveContactList({
  item,
  user,
}: {
  item: ActiveContact;
  user: User | null;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [options, setOptions] = useState<boolean>(false);
  const selectedContactID = useAppSelector(
    (store) => store.chat.selectedContact?._id,
  );
  const swidth = useAppSelector((store) => store.layout.screenSize.width);
  const isSelected = selectedContactID === item._id;

  const isOwnMessage = item.lastMessage.sender_id === user?._id;

  const hasAttachments = (item.lastMessage.attachments?.length ?? 0) > 0;

  const isUnread = item.unread > 0;

  const handleClick = useCallback(() => {
    dispatch(setSelectedContactLoading(true));
    router.push(`/c=${item._id}`);
  }, [dispatch, router, item._id]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setOptions((prev) => !prev);
    },
    [],
  );

  const handleOptionsClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      e.stopPropagation();
      setOptions((prev) => !prev);
    },
    [],
  );

  return (
    <div
      className="px-2 w-full"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div
        className={`flex gap-3 px-2.5 py-3 rounded-xl cursor-pointer hover:bg-bgsec active:bg-bgsec ${(options || isSelected) && "bg-bgsec"} group transition-all`}
      >
        <div className="min-w-12 min-h-12 max-w-12 max-h-12 flex justify-center items-center rounded-full self-center border overflow-hidden">
          {item?.pic ? (
            <Image
              loading="eager"
              src={item.pic}
              width={48}
              height={48}
              alt="user pic"
              className="size-full object-cover object-center aspect-square"
            />
          ) : (
            <div className="size-full p-1 flex items-center justify-center uppercase font-bold">
              {validatePhoneNumber(item.name)
                ? item.name.slice(-2)
                : item.name.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center grow">
          <p className="break-all line-clamp-1">{item.name}</p>
          <div className="flex flex-nowrap items-center gap-1">
            {isOwnMessage && !item.lastMessage.deletedFor && (
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
            <small className="text-txpri/75 break-all line-clamp-1 flex items-center min-w-0">
              {hasAttachments ? (
                <div className="mt-1 pr-1 flex flex-nowrap items-center gap-1">
                  <Paperclip size={16} />
                  <span>Attachments</span>
                </div>
              ) : (
                <span className="line-clamp-1 break-all">
                  {item.lastMessage.content}
                </span>
              )}
            </small>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <small
            className={`${isUnread ? "text-pri" : "text-txpri/75"} whitespace-nowrap`}
          >
            {shortTimestamp(item.lastMessage.createdAt)}
          </small>
          <div className="flex items-center self-end gap-2">
            {isUnread && (
              <div className="size-5 rounded-full flex justify-center items-center p-1 bg-pri font-bold text-black">
                <small>{item.unread}</small>
              </div>
            )}
            <div
              className={`${options ? "flex" : "hidden"} group-hover:flex items-center relative`}
              id="activecontactellipsis"
            >
              <ChevronDown
                size={14}
                className="cursor-pointer"
                onClick={handleOptionsClick}
              />
              {options && <ActiveContactListMenu setOptions={setOptions} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default memo(ActiveContactList);
