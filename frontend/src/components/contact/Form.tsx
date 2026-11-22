"use client";
import { useEffect, useState } from "react";
import CountryPicker from "../CountryPicker";
import { LoaderCircle, Plus, X } from "lucide-react";
import useApi from "@/hooks/useApi";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import {
  addContact,
  clearSelectedContact,
  Contact,
  setRightPartActive,
} from "@/redux/slices/ChatSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Form() {
  const { sendRequest, loading } = useApi();
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    dispatch(setRightPartActive(true));
    return () => {
      dispatch(setRightPartActive(false));
    };
  }, []);
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Missing Name");
      return;
    }
    if (!mobileNumber) {
      toast.error("Mobile number requires");
      return;
    }
    sendRequest("api/contacts/new", "POST", {
      name,
      phone: mobileNumber,
      phoneCode: countryCode,
    })
      .then((result) => {
        const resultData = result.data as { message?: string; data: Contact };
        if (result && result.success) {
          toast.success("Contact Added");
          dispatch(addContact(resultData.data));
          setMobileNumber(null);
          setName("");
        } else {
          throw new Error(resultData?.message || "Failed to add contact.");
        }
      })
      .catch((error) => {
        let msg = "Failed to add contact.";
        if (error instanceof Error) {
          msg = error.message;
        }
        toast.error(msg);
      });
  };
  return (
    <section
      className={`relative ${mainLayout.rightpart ? "grow flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)]" : "hidden"}`}
    >
      <div
        className="absolute top-1 right-1 cursor-pointer p-1 rounded-full hover:bg-borderhl/40 active:bg-borderhl/40 transition-all"
        onClick={() => {
          dispatch(clearSelectedContact());
          router.push("/");
        }}
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
          value={name}
          type="text"
          name="cname"
          id="cname"
          placeholder="Name"
          className="py-2.5 px-4 rounded-full border border-borderhl w-8/10"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <div className="w-8/10">
          <CountryPicker
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            setCountryCode={setCountryCode}
            handleSubmit={handleSubmit}
          />
        </div>
        <button
          onClick={handleSubmit}
          className="bg-pri hover:bg-pri/80 active:bg-pri/80 transition-all rounded-full py-1 w-25 font-semibold flex items-center justify-center gap-1 cursor-cell my-3"
        >
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
