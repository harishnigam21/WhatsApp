import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  RefreshCw,
  LoaderCircle,
  QrCode,
  Smartphone,
  MonitorSmartphone,
  Dot,
} from "lucide-react";
import useApi from "@/hooks/useApi";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { ContactSyncSession, setQRSession } from "@/redux/slices/UserSlice";

export default function ContactSyncDialog() {
  const session = useAppSelector((store) => store.user.QRSession);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const { sendRequest } = useApi();
  const { QRparticipants } = useAppSelector((store) => store.user);
  const dispatch = useAppDispatch();
  const generateSession = useCallback(async () => {
    setLoading(true);
    dispatch(setQRSession(null));
    await sendRequest("api/contacts/sync-session", "POST", {})
      .then((result) => {
        const data = result.data as {
          message: string;
          data: ContactSyncSession;
        };
        if (result && result.success) {
          const orResult = data.data;
          dispatch(setQRSession(orResult));
        } else {
          throw new Error(data?.message || "Failed to generate QR code");
        }
      })
      .catch((error) => {
        let msg =
          error instanceof Error ? error.message : "Failed to generate QR code";
        toast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Generate QR when component mounts
  useEffect(() => {
    generateSession();
  }, [generateSession]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;

    const updateCountdown = () => {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
      );

      setRemaining(seconds);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const expired = session !== null && remaining <= 0;

  return (
    <div className="w-full rounded-xl p-6 flex flex-col items-center gap-5">
      <div className="flex items-center gap-2">
        <QrCode size={22} className="text-pri" />
        <h2 className="text-xl font-semibold whitespace-nowrap break-all line-clamp-1">
          Sync Contacts
        </h2>
      </div>

      <p className="text-sm text-center text-gray-500">
        Scan this QR code using your mobile phone to import contacts into your
        account.
      </p>

      <div className="w-full h-full max-w-60 max-h-60 aspect-square flex items-center justify-center rounded-xl bg-bgsec overflow-hidden">
        {loading ? (
          <LoaderCircle className="animate-spin text-gray-500" size={35} />
        ) : session && !expired ? (
          <div className="w-full h-full bg-white flex items-center justify-center">
            <QRCodeSVG value={session.syncURL} size={220} level="M" />
          </div>
        ) : (
          <div className="text-center text-sm text-black font-medium w-full h-full flex items-center justify-center">
            <button
              type="button"
              disabled={loading || (!!session && !expired)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-pri disabled:opacity-50 cursor-pointer relative"
            >
              {loading ? (
                <LoaderCircle size={50} className="animate-spin" />
              ) : (
                <RefreshCw onClick={generateSession} size={50}>
                  <title>Generate QR</title>
                </RefreshCw>
              )}
              <p className="absolute -bottom-5 text-txpri">
                {expired ? "QR code expired" : "QR code unavailable"}
              </p>
            </button>
          </div>
        )}
      </div>

      {session && !expired && !loading && (
        <div className="text-center">
          <p className="text-sm text-gray-500">QR code expires in</p>

          <p className="text-2xl font-semibold tabular-nums">
            {formatTime(remaining)}
          </p>
        </div>
      )}

      {expired && (
        <p className="text-sm text-red-500">
          This QR code has expired. Generate a new one.
        </p>
      )}
      {QRparticipants.length > 0 && (
        <div className="w-full absolute bottom-0 p-3">
          <div className="flex flex-nowrap items-center gap-3">
            <div className="size-2 mt-1 bg-pri rounded-full"></div>
            <span className="my-2">QR Code in use</span>
          </div>
          <hr className="border border-borderhl/40" />
          {QRparticipants.map((item, i) => (
            <div
              key={`QRparticipants/shareContact/${i}`}
              className="flex flex-nowrap items-center gap-5 mt-3 justify-between"
            >
              <div className="flex flex-nowrap items-center gap-3">
                {item.isMobile ? (
                  <Smartphone size={20} />
                ) : (
                  <MonitorSmartphone size={20} />
                )}
                <small>
                  {item.platform}({item.brands.browser})
                </small>
              </div>
              <small>{item.timezone}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
