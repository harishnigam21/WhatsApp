import { parsePhoneNumberFromString } from "libphonenumber-js";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_APPID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const firebaseErrorMessages: Record<string, string> = {
  "auth/invalid-phone-number":
    "Please enter a valid phone number with country code.",

  "auth/missing-phone-number": "Please enter your phone number.",

  "auth/too-many-requests": "Too many attempts. Please try again later.",

  "auth/quota-exceeded":
    "OTP service is temporarily unavailable. Please try again later.",

  "auth/captcha-check-failed": "Verification failed. Please try again.",

  "auth/invalid-app-credential":
    "Unable to verify your request. Please try again.",

  "auth/code-expired": "Your OTP has expired. Please request a new one.",

  "auth/invalid-verification-code":
    "Incorrect OTP. Please check and try again.",

  "auth/session-expired":
    "Your verification session has expired. Please request a new OTP.",

  "auth/network-request-failed":
    "Network error. Please check your internet connection.",
};

export function validatePhoneNumber(phone: string) {
  const phoneNumber = parsePhoneNumberFromString(phone);
  if (!phoneNumber || !phoneNumber.isValid()) {
    return false;
  }
  return true;
}
