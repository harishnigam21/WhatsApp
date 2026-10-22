import { mediaList } from "@/assets/scripts/mediaList";
import { FaceSlightlySmiling, Pen, User } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import BarSpinner from "../loader/BarSpinner";

export default function MoreDetails({
  Name,
  setName,
  Email,
  setEmail,
  Pic,
  setPic,
  Banner,
  setBanner,
  Bio,
  setBio,
  handleInfoSubmit,
  saveInfoLoading,
}: {
  Name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  Email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  Pic: File | null;
  setPic: React.Dispatch<React.SetStateAction<File | null>>;
  Banner: File | null;
  setBanner: React.Dispatch<React.SetStateAction<File | null>>;
  Bio: string;
  setBio: React.Dispatch<React.SetStateAction<string>>;
  handleInfoSubmit: () => void;
  saveInfoLoading: boolean;
}) {
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  useEffect(() => {
    if (Pic instanceof File) {
      setPicPreview(URL.createObjectURL(Pic));
    }
  }, [Pic]);
  useEffect(() => {
    if (Banner instanceof File) {
      setBannerPreview(URL.createObjectURL(Banner));
    }
  }, [Banner]);
  return (
    <section className="w-full h-full flex flex-col grow">
      {/* pic and banner */}
      <div className="w-full h-50 lg:h-70 relative flex justify-center">
        <Image
          loading="eager"
          fill
          src={bannerPreview || mediaList.wCover}
          alt="cover"
          className="w-full object-cover object-center"
        />
        <div className="absolute right-0 bottom-0 bg-pri hover:bg-bgsec active:bg-bgsec transition-all duration-500 p-2 rounded-md">
          <label htmlFor="banner" className="cursor-pointer">
            <Pen size={18}>
              <title>Click to change banner image</title>
            </Pen>
          </label>
          <input
            disabled={saveInfoLoading}
            type="file"
            name="banner"
            id="banner"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                setBanner(files[0]);
              }
            }}
          />
        </div>
        <div className="absolute -bottom-15 size-40 md:size-50 rounded-full overflow-hidden bg-bgpri flex items-center justify-center">
          {picPreview ? (
            <Image
              loading="eager"
              src={picPreview}
              fill
              className="w-full h-full object-cover object-center"
              alt="pic"
            />
          ) : (
            <User className="size-2/5" />
          )}
          <label htmlFor="pic">
            <div className="absolute bottom-0 left-0 bg-pri/40 hover:bg-bgsec/60 active:bg-bgsec/60 transition-all duration-500 py-4 w-full flex justify-center items-center cursor-pointer">
              <Pen size={16}>
                <title>Click to change Pic</title>
              </Pen>
            </div>
          </label>
          <input
            disabled={saveInfoLoading}
            type="file"
            name="pic"
            id="pic"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                setPic(files[0]);
              }
            }}
          />
        </div>
      </div>
      {/* Name, Email and Bio`` */}
      <div className="mt-20 w-full flex flex-col gap-6 justify-center items-center">
        <div className="flex gap-2 px-4 min-w-3/10">
          <strong className="whitespace-nowrap font-medium">
            <span className="after:content-['*'] after:pl-1 after:text-red-500">
              Name
            </span>{" "}
            :{" "}
          </strong>
          <input
            disabled={saveInfoLoading}
            value={Name}
            type="text"
            name="cname"
            id="cname"
            className="outline-none border-b border-borderhl/50 w-full text-txpri/70"
            required
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = document.getElementById("cemail");
                if (target) {
                  target.focus();
                }
              }
            }}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </div>
        <div className="flex gap-2 px-4 min-w-4/10">
          <strong className="whitespace-nowrap font-medium">
            <span className="after:content-['*'] after:pl-1 after:text-red-500">
              Email
            </span>{" "}
            :{" "}
          </strong>
          <input
            disabled={saveInfoLoading}
            value={Email}
            type="email"
            name="cemail"
            id="cemail"
            className="outline-none border-b border-borderhl/50 w-full text-txpri/70"
            required
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = document.getElementById("cbio");
                if (target) {
                  target.focus();
                }
              }
            }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-7/10 px-4">
          <strong className="whitespace-nowrap font-medium">Bio : </strong>
          <div className="w-full border-b border-borderhl/50 flex flex-nowrap gap-2">
            <input
              disabled={saveInfoLoading}
              value={Bio}
              type="text"
              name="cbio"
              id="cbio"
              className="outline-none w-full text-txpri/70"
              onChange={(e) => {
                const trimValue =
                  e.target.value.length > 120
                    ? e.target.value.slice(0, 120)
                    : e.target.value;
                setBio(trimValue);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInfoSubmit();
                }
              }}
            />
            <div className="flex flex-nowrap gap-2 items-center">
              <small className="text-txpri/60">{Bio.length}/120</small>
              <FaceSlightlySmiling
                size={18}
                className="text-txpri/60 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
      {saveInfoLoading ? (
        <div className="flex my-12 self-center flex-nowrap items-center gap-2">
          <BarSpinner size={5} />
          <small className="font-medium text-lg">Saving...</small>
        </div>
      ) : (
        <button
          onClick={handleInfoSubmit}
          className="bg-pri my-12 self-center text-txpri rounded-full py-2 px-5 font-semibold flex items-center text-sm cursor-pointer"
        >
          Next
        </button>
      )}
    </section>
  );
}
