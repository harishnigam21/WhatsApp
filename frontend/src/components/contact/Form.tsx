"use client";
import { useEffect, useRef, useState } from "react";
import CountryPicker from "../CountryPicker";
import { Import, LoaderCircle, Plus, RefreshCcw, X } from "lucide-react";
import useApi from "@/hooks/useApi";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import {
  addContact,
  bulkAddContact,
  clearSelectedContact,
  Contact,
  setRightPartActive,
} from "@/redux/slices/ChatSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatBytes } from "@/utils/formatBytes";
import { createVCF } from "@/utils/createVCF";
import { validatePhoneNumber } from "@/utils/firebase";
import ContactSyncDialog from "./ContactSyncDialog";
type ImportedContact = {
  name: string[];
  tel: string[];
  email: string[];
};
export default function Form() {
  const { sendRequest, loading } = useApi();
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [toggle, setToggle] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const importRef = useRef<HTMLDivElement>(null);
  const manualRef = useRef<HTMLDivElement>(null);
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
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
    if (!validatePhoneNumber(`${countryCode + mobileNumber}`)) {
      toast.error("Invalid Mobile Number");
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
          handelExist();
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
  const ALLOWED_MIME_TYPES = new Set([
    "text/vcard",
    "text/x-vcard",
    "text/directory",
    "application/vcard",
    "application/octet-stream",
    "",
  ]);
  const handleImport = (File: File) => {
    const formData = new FormData();
    if (!File || !ALLOWED_MIME_TYPES.has(File.type.toLowerCase())) {
      toast.error("Invalid File Selected !");
      return;
    }
    formData.append("vcf", File);
    sendRequest("api/contacts/import", "POST", formData)
      .then((result) => {
        if (result.success) {
          const data = result.data as Contact[];
          dispatch(bulkAddContact(data));
          setVcfFile(null);
          toast.success("Successfully Imported");
          handelExist();
        } else {
          const data = result.data as { message: string };
          let msg = data.message || "Failed to Import";
          throw new Error(msg);
        }
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to Import",
        ),
      );
  };

  const syncContacts = async () => {
    setSyncLoading(true);
    try {
      // Check browser support
      if (!("contacts" in navigator)) {
        throw new Error("Your browser does not support native contact selection.");
      }
      const contacts: ImportedContact[] = await (
        navigator as any
      ).contacts.select(["name", "tel", "email"], { multiple: true });
      const formattedContacts = new Map<
        string,
        {
          name: string;
          tel: string;
          email: string;
        }
      >();
      contacts.forEach((c) => {
        if (c.tel.length > 0) {
          formattedContacts.set(c.tel[0], {
            name: c.name?.[0] || "",
            email: c.email?.[0] || "",
            tel: c.tel[0] || "",
          });
        }
      });
      if (contacts.length === 0) return;
      const vcfBlob = createVCF(Array.from(formattedContacts.values()));
      const vcfFile = new File([vcfBlob], "contacts.vcf", {
        type: "text/vcard",
        lastModified: Date.now(),
      });
      setVcfFile(vcfFile);
      handleImport(vcfFile);
    } catch (error) {
      let msg =
        error instanceof Error ? error.message : "Device Contact import failed";
      toast.error(msg);
    } finally {
      setSyncLoading(false);
    }
  };

  const handelExist = () => {
    dispatch(clearSelectedContact());
    router.push("/");
  };

  return (
    <section
      id="ContactForm"
      className={`relative ${mainLayout.rightpart ? "grow flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)]" : "hidden"}`}
    >
      {showQR ? (
        <>
          <div
            className="absolute top-1 right-1 cursor-pointer p-1 rounded-full hover:bg-borderhl/40 active:bg-borderhl/40 transition-all"
            onClick={() => {
              setShowQR(false);
            }}
          >
            <X size={25} strokeWidth={1} className="" />
          </div>
          <article
            className={`p-2 md:p-4 rounded-2xl bg-bgpri/25 flex flex-col items-center justify-center gap-4 w-full max-w-100`}
          >
            <ContactSyncDialog />
          </article>
        </>
      ) : (
        <>
          <div
            className="absolute top-1 right-1 cursor-pointer p-1 rounded-full hover:bg-borderhl/40 active:bg-borderhl/40 transition-all"
            onClick={handelExist}
          >
            <X size={25} strokeWidth={1} className="" />
          </div>
          {toggle ? (
            <article
              ref={importRef}
              style={{ height: `${manualRef.current?.clientHeight}px` }}
              className={`p-2 md:p-4 rounded-2xl bg-bgpri/25 flex flex-col items-center justify-center gap-4 w-full max-w-100`}
            >
              <h3 className="text-2xl lg:text-3xl font-medium my-3 tracking-wide">
                Import contacts
              </h3>

              <div className="w-95/100 sm:w-8/10 grow flex flex-col justify-around">
                <button
                  onClick={syncContacts}
                  className="rounded-full py-2.5 px-4 w-full border border-borderhl cursor-pointer font-medium hover:bg-pri/40 active:bg-pri/40 transition-all duration-700 break-all line-clamp-1 flex flex-nowrap items-center justify-center gap-2 relative"
                >
                  This device contacts
                  {syncLoading && (
                    <RefreshCcw
                      size={14}
                      strokeWidth={4}
                      className="animate-spin text-pri absolute right-4"
                    />
                  )}
                </button>
                <button
                  className={`rounded-full mt-4 py-2.5 px-4 w-full border border-borderhl cursor-pointer font-medium hover:bg-pri/40 active:bg-pri/40 transition-all duration-700 break-all line-clamp-1 flex flex-nowrap items-center justify-center gap-2 relative ${showQR && "bg-pri/40"}`}
                  onClick={() => setShowQR(true)}
                >
                  Sync from another device
                </button>
                <label
                  htmlFor="uploadvcf"
                  className="rounded-full py-2.5 px-4 w-full border border-borderhl cursor-pointer font-medium hover:bg-pri/40 active:bg-pri/40 transition-all duration-700 mt-4 break-all line-clamp-1 flex justify-center"
                >
                  Upload contact file
                </label>
                <input
                  type="file"
                  name="uploadvcf"
                  id="uploadvcf"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      if (file.size > 5000000) {
                        toast.error("Keep file within 5MB");
                        return;
                      }
                      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
                        toast.error("Only VCF file allowed !");
                        return;
                      }
                      setVcfFile(file);
                    }
                  }}
                  accept=".vcf"
                />
                <small
                  className="self-start mt-1 text-pri text-xs hover:text-pri/80 active:text-pri/80 transition-all ml-2 font-medium cursor-pointer"
                  onClick={() => {
                    setToggle((prev) => !prev);
                  }}
                >
                  add manually ?
                </small>
                <div className=" flex items-center justify-center">
                  {vcfFile ? (
                    <div className="flex justify-center">
                      <div className="flex flex-nowrap items-center gap-3">
                        <div className="flex flex-col items-center">
                          <small className="break-all line-clamp-1">
                            {vcfFile.name}
                          </small>
                          <small className="text-[10px]">{`[ ${formatBytes(vcfFile.size)} ]`}</small>
                        </div>
                        <div
                          className="size-3 rounded-full bg-red-500 flex items-center justify-center cursor-pointer"
                          onClick={() => setVcfFile(null)}
                        >
                          <X color="white" size={10} strokeWidth={4} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <small className="mt-3">Only .VCF file accepted !</small>
                  )}
                </div>
              </div>
              <button
                disabled={!vcfFile || loading ? true : false}
                onClick={() => {
                  if (vcfFile) handleImport(vcfFile);
                }}
                className="bg-pri hover:bg-pri/80 active:bg-pri/80 transition-all rounded-full py-1 w-25 font-semibold flex items-center justify-center gap-1 cursor-cell mt-1 mb-3"
              >
                Import{" "}
                {loading ? (
                  <LoaderCircle
                    size={18}
                    strokeWidth={3}
                    className="animate-spin"
                  />
                ) : (
                  <Import size={18} strokeWidth={3} className="mt-1" />
                )}
              </button>
            </article>
          ) : (
            <article
              ref={manualRef}
              className={`p-2 md:p-4 rounded-2xl bg-bgpri/25 flex flex-col items-center justify-center gap-4 w-full max-w-100`}
            >
              <h3 className="text-2xl lg:text-3xl font-medium my-3 tracking-wide">
                Add to contact
              </h3>
              <input
                value={name}
                type="text"
                name="cname"
                id="cname"
                placeholder="Name"
                className="py-2.5 px-4 rounded-full border border-borderhl w-95/100 sm:w-8/10"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
              <div className="w-95/100 sm:w-8/10">
                <CountryPicker
                  mobileNumber={mobileNumber}
                  setMobileNumber={setMobileNumber}
                  setCountryCode={setCountryCode}
                  handleSubmit={handleSubmit}
                />
                <small
                  className="self-start text-pri text-xs hover:text-pri/80 active:text-pri/80 transition-all ml-2 font-medium cursor-pointer"
                  onClick={() => {
                    setToggle((prev) => !prev);
                  }}
                >
                  want to import ?
                </small>
              </div>
              <button
                onClick={handleSubmit}
                className="bg-pri hover:bg-pri/80 active:bg-pri/80 transition-all rounded-full py-1 w-25 font-semibold flex items-center justify-center gap-1 cursor-cell mt-1 mb-3"
              >
                Add{" "}
                {loading ? (
                  <LoaderCircle
                    size={18}
                    strokeWidth={3}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={18} strokeWidth={3} className="mt-1" />
                )}
              </button>
            </article>
          )}
        </>
      )}
    </section>
  );
}
