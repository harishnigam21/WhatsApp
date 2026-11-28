"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LoaderCircle,
  Smartphone,
  RefreshCw,
  LogOut,
  Import,
  CloudUpload,
  SquareCheck,
  BookOpenCheck,
  X,
  Check,
} from "lucide-react";
import useApi from "@/hooks/useApi";
import toast from "react-hot-toast";
import { Thumbmark } from "@thumbmarkjs/thumbmarkjs";
import { DeviceMetadata } from "@/redux/slices/UserSlice";
import { formatTimeToAmPm } from "@/utils/dateFormats";
import { createVCF } from "@/utils/createVCF";
import { formatBytes } from "@/utils/formatBytes";

interface SyncSession {
  sessionId: string;
  expiresAt: string;
}

interface DeviceContact {
  name?: string[];
  tel?: string[];
  email?: string[];
}

interface NormalizedContact {
  name: string;
  tel: string;
  email: string;
}

interface ContactPickerNavigator extends Navigator {
  contacts?: {
    select(
      properties: string[],
      options?: { multiple?: boolean },
    ): Promise<DeviceContact[]>;
  };
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: {
    mobile: boolean;
    platform: string;
    brands: Array<{ brand: string; version: string }>;
    getHighEntropyValues: (hints: string[]) => Promise<{
      model?: string;
      platform?: string;
      platformVersion?: string;
      architecture?: string;
      brands?: Array<{ brand: string; version: string }>;
    }>;
  };
}
type PageStatus = "loading" | "valid" | "invalid";
type BrandEntry = { brand: string; version: string };
export default function ContactSyncPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { sendRequest: validateSendRequest } = useApi();
  const { sendRequest: abortRequest, loading: abortLoading } = useApi();
  const { sendRequest: importRequest, loading: importLoading } = useApi();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [session, setSession] = useState<SyncSession | null>(null);
  const [error, setError] = useState("");
  const [deviceMD, setDeviceMD] = useState<DeviceMetadata>();
  const [contacts, setContacts] = useState<NormalizedContact[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSupported, setPickerSupported] = useState(false);
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const ALLOWED_MIME_TYPES = new Set([
    "text/vcard",
    "text/x-vcard",
    "text/directory",
    "application/vcard",
    "application/octet-stream",
    "",
  ]);
  const handleImport = (File: File) => {
    if (!token || !deviceMD?.thumbmark) {
      toast.error("UnAuthorized Link.");
      return;
    }
    const formData = new FormData();
    if (!File || !ALLOWED_MIME_TYPES.has(File.type.toLowerCase())) {
      toast.error("Invalid File Selected !");
      return;
    }
    formData.append("vcf", File);
    formData.append("thumbmark", deviceMD.thumbmark);
    importRequest(`api/contacts/import-sync-session/${token}`, "POST", formData)
      .then((result) => {
        if (result.success) {
          setSuccess(true);
          setVcfFile(null);
          setContacts([]);
          setSession(null);
          toast.success("Successfully Imported");
        } else {
          const data = result.data as { message: string };
          let msg = data.message || "Failed to Import";
          throw new Error(msg);
        }
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "Failed to Import";
        setError(msg);
        setStatus("invalid");
        toast.error(msg);
      });
  };
  const handleSelectContacts = async () => {
    const contactNavigator = navigator as ContactPickerNavigator;

    if (!contactNavigator.contacts?.select) {
      toast.error("Your browser does not support native contact selection.");
      return;
    }

    try {
      setPickerLoading(true);
      const contacts = await contactNavigator.contacts.select(
        ["name", "tel", "email"],
        { multiple: true },
      );
      const formattedContacts = new Map<string, NormalizedContact>();
      contacts.forEach((c) => {
        if (c.tel && c.tel.length > 0) {
          formattedContacts.set(c.tel[0], {
            name: c.name?.[0] || "",
            email: c.email?.[0] || "",
            tel: c.tel[0] || "",
          });
        }
      });
      if (contacts.length === 0) return;
      const fContacts = Array.from(formattedContacts.values());
      setContacts(fContacts);
      const vcfBlob = createVCF(fContacts);
      const vcfFile = new File([vcfBlob], "contacts.vcf", {
        type: "text/vcard",
        lastModified: Date.now(),
      });
      setVcfFile(vcfFile);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // User cancelled the native contact picker.
        return;
      }
      console.error("Contact picker error:", error);
      toast.error("Unable to access selected contacts.");
    } finally {
      setPickerLoading(false);
    }
  };
  const parseBrowserFromBrands = (brands: BrandEntry[] = []) => {
    const ignoredBrands = new Set([
      "Chromium",
      "Not.A/Brand",
      "Not/A)Brand",
      "Not A;Brand",
    ]);
    const specific = brands.find(
      (b) =>
        b.brand && !ignoredBrands.has(b.brand) && !b.brand.startsWith("Not"),
    );
    if (specific) {
      return { browser: specific.brand, version: specific.version };
    }
    const chromium = brands.find((b) => b.brand === "Chromium");
    if (chromium) {
      return { browser: "Chromium", version: chromium.version };
    }
    return { browser: "Unknown", version: "" };
  };
  async function collectDeviceMetadata(): Promise<DeviceMetadata> {
    const tm = new Thumbmark();
    const tmResult = await tm.get();

    const nav = navigator as NavigatorWithUAData;
    let model: string | null = null;
    let platform: string | null = nav.userAgentData?.platform ?? null;
    let brands = nav.userAgentData?.brands ?? [];

    // Supported mainly on Chromium-based browsers over HTTPS; returns "" or throws if unsupported/blocked
    if (nav.userAgentData?.getHighEntropyValues) {
      try {
        const hints = await nav.userAgentData.getHighEntropyValues([
          "model",
          "platform",
          "platformVersion",
          "architecture",
          "brands",
        ]);
        model = hints.model ? hints.model : null;
        platform = hints.platform ?? platform;
        brands = hints.brands ?? brands;
      } catch {
        // Fallback to standard navigator/User-Agent values when denied or unsupported
        setStatus("invalid");
        setError("Permission denied by you, to continue click allow on popup.");
      }
    }
    const data = {
      thumbmark: tmResult.thumbmark ?? "",
      model,
      platform,
      isMobile:
        nav.userAgentData?.mobile ??
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
      brands: parseBrowserFromBrands(brands),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    };
    return data;
  }
  const AbortSession = () => {
    if (!token || !deviceMD?.thumbmark) {
      toast.error("UnAuthorized Link.");
      return;
    }
    abortRequest(
      `api/contacts/abort-sync-session/${encodeURIComponent(token)}`,
      "POST",
      { thumbmark: deviceMD?.thumbmark },
    ).then((result) => {
      setStatus("invalid");
      setSession(null);
      setContacts([]);
      setVcfFile(null);
      setError("Session aborted.");
      toast.success("Session aborted.");
    });
  };
  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      setStatus("loading");

      await validateSendRequest(
        `api/contacts/sync-session/${encodeURIComponent(token)}`,
        "POST",
        { deviceMetaData: deviceMD },
      )
        .then((result) => {
          const resData = result.data as {
            data: SyncSession;
            message: string;
          };
          if (result && result.success) {
            if (!active) return;
            setSession(resData.data);
            setStatus("valid");
          } else {
            throw new Error(
              resData?.message || "QR code is invalid or expired",
            );
          }
        })
        .catch((err) => {
          if (!active) return;
          setError(
            err instanceof Error ? err.message : "Unable to verify QR code",
          );

          setStatus("invalid");
        });
    };

    if (token && deviceMD?.thumbmark) {
      validateSession();
    }

    return () => {
      active = false;
    };
  }, [token, deviceMD?.thumbmark]);
  useEffect(() => {
    const getMetaData = async () => {
      const metaData = await collectDeviceMetadata();
      setDeviceMD(metaData);
    };
    getMetaData();
    setPickerSupported(
      !!(navigator as ContactPickerNavigator).contacts?.select,
    );
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6">
        <LoaderCircle className="animate-spin" size={40} />
        <p className="text-sm text-gray-500">Verifying QR code...</p>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
        <RefreshCw size={42} className="text-red-500" />

        <h1 className="text-xl font-semibold">Unable to Sync Contacts</h1>

        <p className="text-sm text-gray-500">{error}</p>

        <p className="text-xs text-gray-400">
          Please generate a new QR code from your desktop.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center transition-all">
        <div className="relative inline-flex flex-col items-center justify-center rounded-full p-0.75">
          <div
            className={`absolute inset-0 rounded-full ${importLoading && "bg-[conic-gradient(transparent_0deg_45deg,#3b82f6_45deg_360deg)] animate-spin"} ${success && "bg-[conic-gradient(transparent_0deg_45deg,green_45deg_360deg)] blur-xl animate-pulse"}`}
          />
          <div
            className={`relative z-10 rounded-full bg-blue-100 text-pri p-5`}
          >
            {success ? (
              <Check
                strokeWidth={6}
                size={38}
                style={{
                  animationIterationCount: 2,
                  animationDuration: "0.5s",
                }}
                className="animate-ping"
              />
            ) : (
              <Smartphone size={38} />
            )}
          </div>
          {success && <p>SUCCESS !</p>}
        </div>
        {!success && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Sync Your Contacts</h1>

              <p className="text-sm text-gray-500 mt-2">
                Select contacts from your phone and import them into your
                account.
              </p>
            </div>

            <div className="w-full rounded-xl border border-borderhl p-4">
              <p className="text-sm text-green-600 font-medium">
                QR code verified successfully
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Your device is ready to import contacts.
              </p>
            </div>
            {session && (
              <p className="text-xs text-gray-400">
                Session expires at:{" "}
                {session.expiresAt
                  ? formatTimeToAmPm(new Date(session.expiresAt))
                  : ""}
              </p>
            )}

            {pickerSupported ? (
              <div className="flex flex-col">
                <div className="w-full rounded-lg border border-borderhl p-4 text-center">
                  <p className="text-sm font-medium text-green-600">
                    Native Contact Picker Available
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Your browser support direct contact selection. Click below
                    selection button to select contact fron this device..
                  </p>
                  <div
                    className={`relative ${pickerLoading && "animate-pulse"}`}
                  >
                    <p className="text-[8px] rounded-full bg-pri absolute -top-1 left-3 px-2 font-bold tracking-widest text-black">
                      Available
                    </p>
                    <button
                      className="flex flex-nowrap gap-2 cursor-pointer items-center py-3 px-3 rounded-2xl self-center mt-4 w-full justify-self-center justify-center whitespace-nowrap border text-white/50 border-borderhl/40 bg-bgsec/40 hover:bg-bgsec/60 active:bg-bgsec/60 transition-all"
                      onClick={handleSelectContacts}
                    >
                      <span className="">Select</span>
                      <BookOpenCheck strokeWidth={1} className="size-12">
                        <title>Select Contacts</title>
                      </BookOpenCheck>
                      <span className="">Contacts</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="w-full rounded-lg border border-borderhl p-4 text-center">
                  <p className="text-sm font-medium text-red-500">
                    Native Contact Picker Unavailable
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    Your browser doesn't support direct contact selection.
                    Please use a supported Android browser or export your
                    contacts as a VCF file.
                  </p>
                  <div className="relative">
                    <label
                      htmlFor="vcfUpload"
                      className="flex flex-nowrap gap-2 cursor-pointer items-center py-5 px-3 rounded-2xl self-center mt-4 w-full justify-self-center justify-center whitespace-nowrap border text-white/50 border-borderhl/40 bg-bgsec/40 hover:bg-bgsec/60 active:bg-bgsec/60 transition-all"
                    >
                      <span className="mr-2">Upload</span>
                      <CloudUpload
                        strokeWidth={1}
                        className="size-12 scale-150"
                      >
                        <title>Upload VCF File</title>
                      </CloudUpload>
                      <span className="ml-2">VCF File</span>
                    </label>
                    <input
                      type="file"
                      name="vcfUpload"
                      id="vcfUpload"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const file = files[0];
                          if (file.size > 5000000) {
                            toast.error("Keep file within 5MB");
                            return;
                          }
                          if (
                            !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())
                          ) {
                            toast.error("Only VCF file allowed !");
                            return;
                          }
                          setVcfFile(file);
                        }
                      }}
                      accept=".vcf"
                    />
                    <p className="text-[8px] rounded-full bg-pri absolute -top-1 left-3 px-2 font-bold tracking-widest text-black">
                      Available
                    </p>
                  </div>
                </div>
              </div>
            )}
            {vcfFile && (
              <div className="flex flex-nowrap gap-3 items-center">
                <div className="flex flex-col justify-center">
                  <small>{vcfFile.name}</small>
                  <small>
                    (
                    {contacts.length > 0
                      ? contacts.length
                      : formatBytes(vcfFile.size)}
                    )
                  </small>
                </div>
                <div
                  className="size-3 rounded-full bg-red-500 flex items-center justify-center cursor-pointer"
                  onClick={() => setVcfFile(null)}
                >
                  <X color="white" size={10} strokeWidth={4} />
                </div>
              </div>
            )}
            <button
              disabled={vcfFile ? false : true}
              className="py-2 px-3 bg-pri rounded-xl min-w-5/10 max-w-9/10 cursor-pointer flex items-center justify-center gap-1"
              onClick={() => {
                if (vcfFile) handleImport(vcfFile);
              }}
            >
              Submit{" "}
              {importLoading && vcfFile && (
                <LoaderCircle size={20} className="animate-spin" />
              )}
            </button>
          </>
        )}
      </div>
      {!success && (
        <div className="fixed top-1 right-1 cursor-pointer text-pri p-1">
          {abortLoading ? (
            <LoaderCircle size={25} className="animate-spin" />
          ) : (
            <LogOut size={25} onClick={AbortSession}>
              <title>Cancel Contact transfer</title>
            </LogOut>
          )}
        </div>
      )}
    </main>
  );
}
