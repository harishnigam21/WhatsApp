import useApi from "@/hooks/useApi";
import { setLoginStatus, setUser, User } from "@/redux/slices/UserSlice";
import { useAppDispatch } from "@/redux/Store";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import BarSpinner from "../loader/BarSpinner";
import { X } from "lucide-react";

export default function OTPVerify({
  mobileNumber,
  timer,
  countryCode,
  resendStatus,
  sendOTPLoading,
  setAgree,
  handleWrongNumber,
  handlSendOTP,
}: {
  timer: number;
  countryCode: string;
  mobileNumber: string;
  resendStatus: boolean;
  sendOTPLoading: boolean;
  setAgree: React.Dispatch<React.SetStateAction<boolean>>;
  handleWrongNumber: () => void;
  handlSendOTP: () => void;
}) {
  type OTPState = [string, string, string, string, string, string];
  const { sendRequest, loading } = useApi();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [otp, setOTP] = useState<OTPState>(Array(6).fill("") as OTPState);
  const [selectedOTPblock, setSelectedOTPblock] = useState<number>(0);
  useEffect(() => {
    if (!mobileNumber || !countryCode) {
      setAgree(false);
    }
  }, [mobileNumber, countryCode]);
  useEffect(() => {
    const targetId = `otp-fields/${selectedOTPblock}`;
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.focus();
    }
  }, [selectedOTPblock]);
  const handleOTPverify = async () => {
    if (loading) return;
    await sendRequest("api/auth/verify-otp", "POST", {
      otp: otp.join(""),
      phone: mobileNumber,
      phoneCode: countryCode,
    })
      .then((result) => {
        const responseData = result.data as {
          message: string;
          user: User;
          actk: string;
        };
        if (result && result.success) {
          toast.success(responseData?.message || "OTP verified successfully");
          dispatch(setLoginStatus("authenticated"));
          dispatch(setUser(responseData.user));
          if (responseData.user._id) {
            dispatch({
              type: "socket/connect",
              payload: responseData.user._id,
            });
          }
          window.localStorage.setItem("actk", responseData.actk);
          router.push("/");
        } else {
          const msg = responseData?.message || "Failed to verify OTP";
          throw new Error(msg);
        }
      })
      .catch((error) => {
        dispatch(setLoginStatus("unauthenticated"));
        toast.error(error?.message || "Failed to verify OTP");
      });
  };
  useEffect(() => {
    let check = true;
    otp.forEach((item, i) => {
      const result = /^[0-9]$/.test(item);
      check = check && result;
    });
    if (check) {
      handleOTPverify();
    }
  }, [otp]);
  return (
    <section className="w-full md:w-1/2 lg:w-4/10 self-center-safe grow flex flex-col gap-8 items-center-safe justify-center-safe p-2">
      <h3 className="text-4xl tracking-wide text-center">
        Verifying your number
      </h3>
      <div className="text-sm sm:text-lg text-center">
        Waiting for 6-digit code send by SMS to {countryCode + mobileNumber}.{" "}
        {loading ? (
          <div className="flex flex-nowrap justify-center items-center gap-1 mt-6">
            <BarSpinner />
            <small className="font-medium">Verifying...</small>
          </div>
        ) : (
          <span
            className="font-medium cursor-pointer text-pri"
            onClick={handleWrongNumber}
          >
            Wrong number?
          </span>
        )}
      </div>
      <div className="flex flex-nowrap items-center gap-3 relative">
        <div className="flex flex-nowrap gap-1 items-center max-w-full overflow-hidden justify-center border-b border-borderhl pb-2">
          {otp.map((item, i) => (
            <input
              value={item}
              key={`otp-fields/${i}`}
              type="text"
              name={`otp-fields/${i}`}
              id={`otp-fields/${i}`}
              className={`outline-none focus:outline-none border ${selectedOTPblock == i ? "focus:border-pri border-borderhl" : "border-borderhl focus:border-borderhl"} rounded-md p-1 text-xl size-10 ${i == 2 && "mr-3"} text-center`}
              placeholder="-"
              required
              onClick={() => {
                setSelectedOTPblock(i);
              }}
              onChange={(e) => {
                const target = e.target.value.slice(-1) as string;
                if (target === "" || /^[0-9]$/.test(target)) {
                  setOTP((prev) => {
                    const next = [...prev];
                    next[i] = target;
                    return next as OTPState;
                  });
                  if (i == otp.length - 1 || target === "") {
                    setSelectedOTPblock(i);
                  } else {
                    setSelectedOTPblock(i + 1);
                  }
                }
              }}
            />
          ))}
        </div>
        <div
          className="cursor-pointer mb-2 absolute -right-5"
          onClick={() => setOTP(Array(6).fill("") as OTPState)}
        >
          <X size={14} color="red">
            <title>Clear</title>
          </X>
        </div>
      </div>
      <div className="flex gap-2 justify-center items-center">
        <span className="text-lg text-center font-medium cursor-pointer text-pri">
          Didn't receive code?
        </span>
        <div className="flex items-center justify-center mt-1">
          {resendStatus ? (
            <div className="flex flex-nowrap items-center gap-0.5 relative">
              <button
                disabled={sendOTPLoading}
                className="text-xs py-0.5 px-2 rounded-full bg-pri cursor-pointer hover:scale-105 active:scale-105 font-medium transition-all"
                onClick={() => {
                  if (resendStatus && timer == 0) {
                    handlSendOTP();
                  }
                }}
              >
                Resend OTP
              </button>
              {sendOTPLoading && (
                <div className="absolute -right-5">
                  <BarSpinner size={3} />
                </div>
              )}
            </div>
          ) : (
            <small className="">resend OTP ({timer}s)</small>
          )}
        </div>
      </div>
    </section>
  );
}
