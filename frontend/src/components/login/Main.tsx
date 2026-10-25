import { useEffect, useState } from "react";
import Welcome from "./Welcome";
import NumberVerify from "./NumberVerify";
import useApi from "@/hooks/useApi";
import toast from "react-hot-toast";
import MoreDetails from "./MoreDetails";
import OTPVerify, { OTPState } from "./OTPVerify";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "@/utils/firebase";
import { setLoginStatus, setUser, User } from "@/redux/slices/UserSlice";
import { useAppDispatch } from "@/redux/Store";
import { useRouter } from "next/navigation";

export default function Main() {
  const [sendOTPLoading, setSendOTPLoading] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const { sendRequest: saveInfoRequest, loading: saveInfoLoading } = useApi();
  const { sendRequest: loginRequest } = useApi();
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
  const [otp, setOTP] = useState<OTPState>(Array(6).fill("") as OTPState);
  const [stoken, setsToken] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<boolean>(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
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
  // handleSendOTP old
  // const handlSendOTP = async () => {
  //   if (sendOTPLoading) return;
  //   if (!countryCode) {
  //     toast.error("No country code selected");
  //     return;
  //   }
  //   if (!mobileNumber) {
  //     toast.error("Mobile number is required");
  //     return;
  //   }
  //   await sendOTPRequest("api/auth/send-otp", "POST", {
  //     phone: mobileNumber,
  //     phoneCode: countryCode,
  //   })
  //     .then((result) => {
  //       const responseData = result.data as {
  //         message: string;
  //         sendOTP?: boolean;
  //         phone?: string;
  //         moreInfo?: boolean;
  //       };
  //       if (result && result.success) {
  //         if (
  //           responseData.phone !==
  //           `${(countryCode || "") + (mobileNumber || "")}`
  //         ) {
  //           toast.error("Mobile number mismatches");
  //           return;
  //         }
  //         setVerifyOTP(true);
  //         setTimerStatus("start");
  //         setTimer(30);
  //         setResendStatus(false);
  //       } else {
  //         if (responseData.moreInfo) {
  //           setMoreDetails(true);
  //           return;
  //         }
  //         throw new Error(responseData?.message || "Failed to send OTP");
  //       }
  //     })
  //     .catch((error) => {
  //       toast.error(error?.message || "Failed to send OTP");
  //     });
  // };

  // Setup reCAPTCHA container
  const setupRecaptcha = async (): Promise<RecaptchaVerifier> => {
    if (!window.recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved");
        },
      });
      window.recaptchaVerifier = verifier;
    }
    await window.recaptchaVerifier.render();
    return window.recaptchaVerifier;
  };

  //handleSendOTP new
  const handleSendOTP = async () => {
    setSendOTPLoading(true);
    try {
      if (sendOTPLoading) return;
      if (!countryCode) {
        toast.error("No country code selected");
        return;
      }
      if (!mobileNumber) {
        toast.error("Mobile number is required");
        return;
      }
      const appVerifier = await setupRecaptcha();
      // Phone number must be in E.164 format, e.g., +919876543210
      const result = await signInWithPhoneNumber(
        auth,
        `${countryCode}${mobileNumber}`,
        appVerifier,
      );
      setConfirmationResult(result);
      setVerifyOTP(true);
      setTimerStatus("start");
      setTimer(30);
      setResendStatus(false);
      toast.success("OTP sent successfully!");
    } catch (error) {
      let msg = "Failed to send OTP";
      if (error instanceof Error) {
        msg = error.message;
      }
      console.log("Error sending OTP:", error);
      toast.error(msg);
    } finally {
      setSendOTPLoading(false);
    }
  };

  const handleInfoSubmit = async () => {
    const formData = new FormData();
    if (saveInfoLoading) return;
    if (!stoken) {
      setMoreDetails(false);
      setVerifyOTP(false);
      return;
    }
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
    formData.append("token", stoken);
    formData.append("name", Name);
    formData.append("email", Email);
    mobileNumber && formData.append("phone", mobileNumber);
    countryCode && formData.append("phoneCode", countryCode);
    Pic && formData.append("pic", Pic);
    Banner && formData.append("banner", Banner);
    formData.append("bio", Bio);
    await saveInfoRequest("api/users/new", "POST", formData)
      .then(async (result) => {
        console.log(result);
        if (result && result.success) {
          await handleVerifyOTP(true);
        } else {
          const responseData = result.data as {
            message: string;
          };
          if (result.status == 403) {
            toast.error(responseData.message);
          } else {
            throw new Error(
              responseData?.message ||
                "Sorry we are unable to move forward now, please try again later",
            );
          }
        }
      })
      .catch((error) => {
        console.log(error);
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

  const handleVerifyOTP = async (skip: boolean = false) => {
    setLoginLoading(true);
    try {
      if (!confirmationResult) {
        setVerifyOTP(false);
        toast.error("Looks like you have not requested for OTP yet !");
        return;
      }
      let idToken = null;
      if (!skip) {
        const result = await confirmationResult.confirm(otp.join(""));
        const user = result.user;
        // Get Firebase ID Token
        idToken = await user.getIdToken();
        setsToken(idToken);
      }
      // Send ID Token to your Node.js backend
      await loginRequest("api/auth/login", "POST", { token: idToken }).then(
        (result) => {
          const responseData = result.data as {
            message: string;
            user: User;
            actk: string;
            moreDetails?: boolean;
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
            if (responseData.moreDetails) {
              setMoreDetails(true);
              return;
            }
            throw new Error(responseData?.message || "Failed to Login");
          }
        },
      );
    } catch (error) {
      let msg = "Invalid OTP. Please try again.";
      console.log("Invalid OTP:", error);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      {!agree ? (
        <Welcome setAgree={setAgree} />
      ) : agree && moreDetails ? (
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
          loginLoading={loginLoading}
        />
      ) : agree && countryCode && mobileNumber && VerifyOTP ? (
        <OTPVerify
          otp={otp}
          setOTP={setOTP}
          countryCode={countryCode}
          loading={loginLoading}
          mobileNumber={mobileNumber}
          setAgree={setAgree}
          handleWrongNumber={handleWrongNumber}
          timer={timer}
          resendStatus={resendStatus}
          handlSendOTP={handleSendOTP}
          sendOTPLoading={sendOTPLoading}
          handleVerifyOTP={handleVerifyOTP}
        />
      ) : (
        <NumberVerify
          mobileNumber={mobileNumber}
          setMobileNumber={setMobileNumber}
          setCountryCode={setCountryCode}
          handlSendOTP={handleSendOTP}
          sendOTPLoading={sendOTPLoading}
        />
      )}
      <div id="recaptcha-container"></div>
    </>
  );
}
