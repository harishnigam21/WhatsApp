import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const sendOTP = async (phone: string) => {
  const verification = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({
      to: phone,
      channel: "sms",
    });

  return verification;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const verificationCheck = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({
      to: phone,
      code: otp,
    });

  return verificationCheck;
};

export const validatePhoneNumber = async (phone: string) => {
  try {
    const result = await client.lookups.v2.phoneNumbers(phone).fetch();

    return {
      valid: result.valid,
      phoneNumber: result.phoneNumber,
    };
  } catch (error) {
    console.error("PHONE LOOKUP ERROR:", error);

    return {
      valid: false,
      phoneNumber: null,
    };
  }
};
