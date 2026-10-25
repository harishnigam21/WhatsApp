import { useEffect, useState } from "react";
import Welcome from "./Welcome";
import NumberVerify from "./NumberVerify";
import useApi from "@/hooks/useApi";
import { Data } from "@/types/data";
import toast from "react-hot-toast";
import MoreDetails from "./MoreDetails";
import OTPVerify from "./OTPVerify";

export default function Main() {
  const { sendRequest: sendOTPRequest, loading: sendOTPLoading } = useApi();
  const { sendRequest: saveInfoRequest, loading: saveInfoLoading } = useApi();
  const [agree, setAgree] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [moreDetails, setMoreDetails] = useState<boolean>(false);
  const [VerifyOTP, setVerifyOTP] = useState<boolean>(false);
  const [Name, setName] = useState<string>("");
  const [Email, setEmail] = useState<string>("");
  const [Pic, setPic] = useState<File | null>(null);
  const [Banner, setBanner] = useState<File | null>(null);
  const [Bio, setBio] = useState<string>("");
  const [timer, setTimer] = useState<number>(30);
  const [timerStatus, setTimerStatus] = useState<"start" | "stop">("stop");
  const [resendStatus, setResendStatus] = useState<boolean>(false);
  useEffect(() => {
    if (timerStatus === "stop") return;

    const resend = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setTimerStatus("stop");
          setResendStatus(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(resend);
  }, [timerStatus]);
  const handleWrongNumber = () => {
    setMobileNumber(null);
    setCountryCode(null);
    setVerifyOTP(false);
    setMoreDetails(false);
  };
  const handlSendOTP = async () => {
    if (sendOTPLoading) return;
    if (!countryCode) {
      toast.error("No country code selected");
      return;
    }
    if (!mobileNumber) {
      toast.error("Mobile number is required");
      return;
    }
    await sendOTPRequest("api/auth/send-otp", "POST", {
      phone: mobileNumber,
      phoneCode: countryCode,
    })
      .then((result) => {
        const responseData = result.data as {
          message: string;
          sendOTP?: boolean;
          phone?: string;
          moreInfo?: boolean;
        };
        if (result && result.success) {
          if (
            responseData.phone !==
            `${(countryCode || "") + (mobileNumber || "")}`
          ) {
            toast.error("Mobile number mismatches");
            return;
          }
          setVerifyOTP(true);
          setTimerStatus("start");
          setTimer(30);
          setResendStatus(false);
        } else {
          if (responseData.moreInfo) {
            setMoreDetails(true);
            return;
          }
          throw new Error(responseData?.message || "Failed to send OTP");
        }
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to send OTP");
      });
  };
  const handleInfoSubmit = async () => {
    const formData = new FormData();
    if (saveInfoLoading) return;
    if (Pic && !(Pic instanceof File)) {
      toast.error("Invalid Pic");
      return;
    }
    if (Banner && !(Banner instanceof File)) {
      toast.error("Invalid Banner");
      return;
    }
    if (!Name.trim() || !Email.trim()) {
      toast.error("Both Name and Email requires");
      return;
    }
    if (Bio && Bio.length > 120) {
      toast.error("Keep Bio within 120 letters");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(Email)) {
      toast.error("Invalid Email ID");
      return;
    }
    formData.append("name", Name);
    formData.append("email", Email);
    mobileNumber && formData.append("phone", mobileNumber);
    countryCode && formData.append("phoneCode", countryCode);
    Pic && formData.append("pic", Pic);
    Banner && formData.append("banner", Banner);
    formData.append("bio", Bio);
    await saveInfoRequest("api/users/new", "POST", formData)
      .then((result) => {
        const responseData = result.data as {
          sendOTP?: boolean;
          phone?: string;
          message: string;
        };
        if (result && result.success && responseData.sendOTP) {
          if (
            responseData.phone !==
            `${(countryCode || "") + (mobileNumber || "")}`
          ) {
            toast.error("Mobile number mismatches");
            return;
          }

          setVerifyOTP(true);
          setMoreDetails(false);
        } else {
          if (result.status == 403) {
            toast.error(responseData.message);
          } else {
            throw new Error(responseData?.message || "Failed to send OTP");
          }
        }
      })
      .catch((error) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error(
            "Sorry we are unable to move forward now, please try again later",
          );
        }
        setAgree(false);
      });
  };

  if (!agree) {
    return <Welcome setAgree={setAgree} />;
  }
  if (agree && moreDetails) {
    return (
      <MoreDetails
        Name={Name}
        setName={setName}
        Email={Email}
        setEmail={setEmail}
        Pic={Pic}
        setPic={setPic}
        Banner={Banner}
        setBanner={setBanner}
        Bio={Bio}
        setBio={setBio}
        handleInfoSubmit={handleInfoSubmit}
        saveInfoLoading={saveInfoLoading}
      />
    );
  }
  if (agree && countryCode && mobileNumber && VerifyOTP) {
    return (
      <OTPVerify
        countryCode={countryCode}
        mobileNumber={mobileNumber}
        setAgree={setAgree}
        handleWrongNumber={handleWrongNumber}
        timer={timer}
        resendStatus={resendStatus}
        handlSendOTP={handlSendOTP}
        sendOTPLoading={sendOTPLoading}
      />
    );
  }
  if (agree) {
    return (
      <NumberVerify
        mobileNumber={mobileNumber}
        setMobileNumber={setMobileNumber}
        setCountryCode={setCountryCode}
        handlSendOTP={handlSendOTP}
        sendOTPLoading={sendOTPLoading}
      />
    );
  }
  return <>Hello</>;
}
