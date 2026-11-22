"use client";
import { useEffect, useState } from "react";
import CountryPicker from "../CountryPicker";
import { LoaderCircle, Plus, X } from "lucide-react";
import useApi from "@/hooks/useApi";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { setRightPartActive } from "@/redux/slices/ChatSlice";
import { useRouter } from "next/navigation";

export default function Form() {
  const { sendRequest, loading } = useApi();
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    dispatch(setRightPartActive(true));
    return () => {
      dispatch(setRightPartActive(false));
    };
  }, []);
  const handleSubmit = () => {};
  return (
    <section
      className={`relative ${mainLayout.rightpart ? "grow flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)]" : "hidden"}`}
    >
      <div
        className="absolute top-1 right-1 cursor-pointer p-1 rounded-full hover:bg-borderhl/40 active:bg-borderhl/40 transition-all"
        onClick={() => router.push("/")}
      >
        <X size={25} strokeWidth={1} className="" />
      </div>
      <article
        className={`p-2 md:p-4 rounded-2xl bg-bgpri/25 flex flex-col items-center justify-center gap-4 w-full max-w-100`}
      >
        <h3 className="text-xl lg:text-2xl font-medium my-3 tracking-wide">
          Add to contact
        </h3>
        <input
          type="text"
          name="cname"
          id="cname"
          placeholder="Name"
          className="py-2.5 px-4 rounded-full border border-borderhl w-8/10"
        />
        <div className="w-8/10">
          <CountryPicker
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            setCountryCode={setCountryCode}
            handleSubmit={handleSubmit}
          />
        </div>
        <button className="bg-pri hover:bg-pri/80 active:bg-pri/80 transition-all rounded-full py-1 w-25 font-semibold flex items-center justify-center gap-1 cursor-cell my-3">
          Add{" "}
          {loading ? (
            <LoaderCircle size={18} strokeWidth={3} className="animate-spin" />
          ) : (
            <Plus size={18} strokeWidth={3} className="mt-1" />
          )}
        </button>
      </article>
    </section>
  );
}
