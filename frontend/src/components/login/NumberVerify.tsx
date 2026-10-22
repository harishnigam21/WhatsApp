import WhatsAppIcon from "../WhatsAppIcon";
import CountryPicker from "../CountryPicker";
import BarSpinner from "../loader/BarSpinner";
import { useRouter } from "next/navigation";

export default function NumberVerify({
  mobileNumber,
  setMobileNumber,
  setCountryCode,
  handlSendOTP,
  sendOTPLoading,
}: {
  mobileNumber: string | null;
  setMobileNumber: React.Dispatch<React.SetStateAction<string | null>>;
  setCountryCode: React.Dispatch<React.SetStateAction<string | null>>;
  handlSendOTP: () => void;
  sendOTPLoading: boolean;
}) {
  const router = useRouter();
  return (
    <section className="text-txpri w-full grow flex flex-col">
      <header className="flex gap-1 items-center py-3 px-8">
        <div
          className="flex gap-1 items-center cursor-pointer"
          onClick={() => {
            router.push("/");
          }}
        >
          <div className="size-8">
            <WhatsAppIcon />
          </div>
          <strong className="text-pri font-semibold tracking-wide text-[15px]">
            {process.env.NEXT_PUBLIC_PROJECT_NAME}
          </strong>
        </div>
      </header>
      <div className="flex grow w-full items-center-safe justify-center-safe p-2 sm:p-4">
        <div className="w-full sm:w-3/4 lg:w-1/2 border border-borderhl bg-bgsec rounded-3xl flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full relative lg:w-[60%] sm:w-3/4 flex flex-col items-center gap-8">
            <div className="flex flex-col justify-center items-center gap-1">
              <h3 className="text-3xl sm:text-4xl">Enter phone number</h3>
              <small className="text-sm sm:text-lg font-thin tracking-wide text-center">
                Select a country and enter your phone number
              </small>
            </div>
            <CountryPicker
              mobileNumber={mobileNumber}
              setMobileNumber={setMobileNumber}
              setCountryCode={setCountryCode}
              handlSendOTP={handlSendOTP}
            />
            {sendOTPLoading ? (
              <div className="flex flex-nowrap items-center gap-1">
                <BarSpinner />
                <small className="font-medium">Connecting...</small>
              </div>
            ) : (
              <button
                onClick={handlSendOTP}
                className="bg-pri text-txpri rounded-full py-2 px-5 font-semibold flex items-center text-sm cursor-pointer"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
