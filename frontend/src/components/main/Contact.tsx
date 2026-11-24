import {
  setRightPartActive,
  setSelectedContactLoading,
} from "@/redux/slices/ChatSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { ArrowLeft, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoKeypad } from "react-icons/io5";
import { MdGroupAdd, MdGroups, MdPersonAddAlt1 } from "react-icons/md";
import ContactList from "./ContactList";
import toast from "react-hot-toast";

export default function Contact({
  showContact,
  setShowContact,
  searchFocus,
  setSearcFocus,
}: {
  showContact: boolean;
  setShowContact: React.Dispatch<React.SetStateAction<boolean>>;
  searchFocus: boolean;
  setSearcFocus: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const user = useAppSelector((store) => store.user.userInfo);
  const { Contacts } = useAppSelector((store) => store.chat);
  const dispatch = useAppDispatch();
  const router = useRouter();
  return (
    <article
      className={`flex flex-col gap-2 absolute top-0 left-0 ${showContact ? "w-full opacity-100" : "w-0 opacity-0 p-0"} transition-all ease-in-out h-full z-20 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] duration-500 whitespace-nowrap overflow-x-hidden`}
    >
      <div className="flex flex-col gap-2 sticky top-0 p-3">
        {/* heading */}
        <div className="flex flex-nowrap justify-between gap-2 items-center">
          <div className="flex flex-nowrap gap-3 items-center">
            <div
              className="p-2 hover:bg-bgsec active:bg-bgsec rounded-full cursor-pointer transition-all"
              onClick={() => setShowContact(false)}
            >
              <ArrowLeft size={20} />
            </div>
            <p className="mb-1">New Chat</p>
          </div>
          <IoKeypad className="size-6" />
        </div>
        {/* search */}
        <div
          className={`w-full my-2 mt-4 self-center bg-bgsec rounded-full flex flex-nowrap items-center py-1 px-3 gap-2 ${searchFocus && "border border-pri"}`}
        >
          <Search strokeWidth={1} size={16} />
          <input
            type="searchPeople"
            name="searchPeople"
            id="searchPeople"
            placeholder="Search name, number"
            className="w-full py-1.5 text-sm outline-none focus:outline-none place-content-center"
            onFocus={() => {
              setSearcFocus(true);
            }}
            onBlur={() => {
              setSearcFocus(false);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 pl-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-borderhl">
        {/* new peoples */}
        <div className="flex flex-col">
          {[
            {
              icon: MdGroupAdd,
              name: "New Group",
              onClick: () => {
                toast.dismiss();
                toast.error("Coming Soon - We are working on Group Feature !");
              },
            },
            {
              icon: MdPersonAddAlt1,
              name: "New Contact",
              onClick: () => {
                router.push("/contact");
              },
            },
            {
              icon: MdGroups,
              name: "New Community",
              onClick: () => {
                toast.dismiss();
                toast.error(
                  "Coming Soon - We are working on Community Feature !",
                );
              },
            },
          ].map((item, i) => (
            <div
              key={`contactpanel/new/list/${i}`}
              onClick={item.onClick}
              className="flex p-3 gap-4 rounded-xl items-center cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all"
            >
              <div className="rounded-full p-2 min-h-11 min-w-11 aspect-square bg-pri text-black">
                <item.icon className="size-full" />
              </div>
              <p>{item.name}</p>
            </div>
          ))}
        </div>
        {/* your self */}
        <div
          className="flex p-3 gap-4 rounded-xl items-center cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all"
          onClick={() => {
            dispatch(setSelectedContactLoading(true));
            router.push(`/c=${user?._id}`);
            setShowContact(false);
          }}
        >
          <div className="rounded-full overflow-hidden min-h-11 min-w-11 aspect-square bg-pri text-black">
            {user?.pic ? (
              <Image
                loading="eager"
                src={user.pic}
                width={10}
                height={10}
                alt="user pic"
                className="size-full object-cover object-center"
              />
            ) : (
              <div className="size-full p-1 flex items-center justify-center uppercase font-bold">
                {user?.name.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between">
            <p className="">
              {user?.phoneCode} {user?.phone} (you)
            </p>
            <p className="text-txpri/70 text-sm">Message yourself</p>
          </div>
        </div>
        {/* other contacts */}
        {Contacts.map((item, i) => (
          <ContactList
            key={`contact/other/${i}`}
            item={item}
            setShowContact={setShowContact}
          />
        ))}
      </div>
    </article>
  );
}
