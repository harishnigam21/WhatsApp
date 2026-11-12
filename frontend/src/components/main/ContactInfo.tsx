import { useAppSelector } from "@/redux/Store";
import {
  Ban,
  Bell,
  BookCopy,
  CircleMinus,
  ClockFading,
  Download,
  Heart,
  LockKeyhole,
  LucideIcon,
  Palette,
  Pen,
  Shield,
  Star,
  ThumbsDown,
  Trash,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { MdPermMedia } from "react-icons/md";

export default function ContactInfo({
  contactInfo,
  setContactInfo,
  optionItem,
}: {
  contactInfo: boolean;
  setContactInfo: React.Dispatch<React.SetStateAction<boolean>>;
  optionItem: { icon: LucideIcon; name: string }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userInfo = useAppSelector((store) => store.user.userInfo);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        target.id !== "forContactInfo" &&
        !target.closest("#forContactInfo")
      ) {
        setContactInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (!userInfo) return;
  return (
    <article
      ref={containerRef}
      className="relative w-full h-full overflow-y-scroll scrollbar-thin scrollbar-thumb-borderhl/40"
    >
      {/* close,title and edit */}
      <div className="flex flex-nowrap items-center justify-between gap-1 sticky top-0 z-20 bg-[color-mix(in_srgb,var(--color-bgpri)_100%,var(--color-borderhl)_30%)] px-4 pt-4 pb-4">
        <div className="flex items-center flex-nowrap gap-4">
          <div
            className="cursor-pointer hover:bg-borderhl/40 active:bg-borderhl/40 rounded-full transition-all p-2"
            onClick={() => {
              setContactInfo(false);
            }}
          >
            <X size={23} strokeWidth={2} />
          </div>
          <p className="font-medium">Contact Info</p>
        </div>
        <div className="cursor-pointer hover:bg-borderhl/40 active:bg-borderhl/40 rounded-full transition-all p-2">
          <Pen size={18} />
        </div>
      </div>
      <div className="flex flex-col gap-1 animate-[fromTop_0.3s_ease-in-out] p-4">
        {/* picture, name, number */}
        <div className="flex flex-col items-center-safe p-4 pt-3 gap-2">
          <div className="size-30 rounded-full overflow-hidden relative">
            {userInfo.pic ? (
              <Image src={userInfo.pic} loading="lazy" fill alt="user pic" />
            ) : (
              <div className="size-full flex justify-center items-center text-4xl font-semibold bg-pri/40">
                {userInfo?.name[0]}
              </div>
            )}
          </div>
          <h4 className="text-xl md:text-2xl font-medium">{userInfo.name}</h4>
          <p className="text-txpri/50 font-medium">
            {userInfo.phoneCode} {userInfo.phone}
          </p>
        </div>
        {/* voice,video,search button */}
        <div className="flex flex-nowrap gap-3 justify-center">
          {optionItem.map((item, i) => (
            <div
              key={`contactInfo/icon/${i}`}
              className="flex flex-col justify-center items-center gap-1"
            >
              <div className="hover:bg-borderhl/75 active:bg-borderhl/75 bg-borderhl/40 rounded-3xl py-3 px-5 cursor-pointer transition-all">
                <item.icon className="" size={20} />
              </div>
              <small>{item.name.split(" ")[0]}</small>
            </div>
          ))}
        </div>
        <hr className="border w-full mt-6 border-borderhl/40" />
        <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
          <div className="flex flex-nowrap items-center gap-5">
            <MdPermMedia className="size-5 text-txpri/50 font-medium" />
            <p>Media, links and docs</p>
          </div>
          <div>0</div>
        </div>
        <hr className="border w-full border-borderhl/40" />
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-1 items-center justify-between p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Star className="size-5 text-txpri/50 font-medium" />
              <p>Starred messages</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Bell className="size-5 text-txpri/50 font-medium" />
              <p>Mute notifications</p>
            </div>
            <div className="w-10 h-5 flex items-center border rounded-full border-borderhl px-0.5 group">
              <div className="size-3.5 group-hover:w-4 group-hover:h-3 rounded-full bg-borderhl transition-all"></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between p-4 py-2 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <ClockFading className="size-5 text-txpri/50 font-medium" />
              <div className="flex flex-col">
                <p>Disappearing messages</p>
                <p className="text-txpri/50">Off</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between p-4 py-2 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Shield className="size-5 text-txpri/50 font-medium" />
              <div className="flex flex-col">
                <p>Restrict Chat</p>
                <p className="text-txpri/50">Off</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Palette className="size-5 text-txpri/50 font-medium" />
              <p>Chat theme</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between p-4 py-2 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <LockKeyhole className="size-5 text-txpri/50 font-medium" />
              <div className="flex flex-col">
                <p>Encryption</p>
                <p className="text-txpri/50">
                  Messages are end-to-end encrypted. Click to verify
                </p>
              </div>
            </div>
          </div>
        </div>
        <hr className="border w-full border-borderhl/40 mt-3 mb-1" />
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Heart className="size-5 text-txpri/50 font-medium" />
              <p>Add to favorites</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <BookCopy className="size-5 text-txpri/50 font-medium" />
              <p>Add to list</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-borderhl/20 active:bg-borderhl/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Download className="size-5 text-txpri/50 font-medium" />
              <p>Export chat</p>
            </div>
          </div>
        </div>
        <hr className="border w-full border-borderhl/40 mt-1 mb-1" />
        <div className="flex flex-col text-[#f1949e]/80">
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-[#f1949e]/20 active:bg-[#f1949e]/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <CircleMinus className="size-5 font-medium " />
              <p>Add to favorites</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-[#f1949e]/20 active:bg-[#f1949e]/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Ban className="size-5 font-medium" />
              <p>Block {userInfo.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-[#f1949e]/20 active:bg-[#f1949e]/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <ThumbsDown className="size-5 font-medium" />
              <p>Report {userInfo.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-between my-0.5 p-4 rounded-xl hover:bg-[#f1949e]/20 active:bg-[#f1949e]/20 transition-all cursor-pointer">
            <div className="flex flex-nowrap items-center gap-5">
              <Trash className="size-5 font-medium" />
              <p>Delete chat</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
