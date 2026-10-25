import { Request, Response } from "express";
import { sendOTP, validatePhoneNumber, verifyOTP } from "../utils/twilio";
import { getServerError } from "../utils/serverError";
import jwt from "jsonwebtoken";
import User from "../models/User";
import redisConnect from "../config/redis_connect";
const in_production = process.env.IN_PRODUCTION === "true";
export const sendOTPCon = async (req: Request, res: Response) => {
  try {
    const { phone, phoneCode } = req.body;
    if (!phone || !phoneCode) {
      return res.status(400).json({ message: "Mobile Number is required." });
    }
    const joinPhoneNum = `${phoneCode + phone}`;
    const phoneResult = await validatePhoneNumber(joinPhoneNum);
    if (!phoneResult.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    const accountExist = await User.findOne({ phone, phoneCode });
    if (!accountExist) {
      return res.status(403).json({
        message: "Add more details",
        phone: `${phoneCode + phone}`,
        moreInfo: true,
      });
    }
    const otpResult = await sendOTP(phoneResult.phoneNumber!);

    //bypass
    // const otpResult = { status: true };

    return res.status(200).json({
      sendOTP: true,
      message: "OTP sent successfully",
      status: otpResult.status,
      phone: phoneResult.phoneNumber,
    });
  } catch (error) {
    getServerError(res, error, "SignIn Controller", "Failed to send OTP");
  }
};

export const verifyOTPCon = async (req: Request, res: Response) => {
  try {
    const { phone, phoneCode, otp } = req.body;

    if (!phone || !otp || !phoneCode) {
      return res.status(400).json({
        message: "Phone and OTP are required",
      });
    }
    const accountExist = await User.findOne({ phone, phoneCode });
    if (!accountExist) {
      return res.status(401).json({
        message: "Account not found !",
      });
    }
    // Verify OTP through Twilio
    const result = await verifyOTP(`${phoneCode + phone}`, otp);

    //bypass
    // const result = {
    //   status: "approved",
    // };

    if (result.status !== "approved") {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const access_token = jwt.sign(
      { id: accountExist._id },
      process.env.ACCESS_TOKEN_KEY!,
      { expiresIn: "1d" },
    );
    const refresh_token = jwt.sign(
      { id: accountExist._id },
      process.env.REFRESH_TOKEN_KEY!,
      { expiresIn: "7d" },
    );
    const updateRefreshToken = await User.findByIdAndUpdate(
      accountExist._id,
      {
        $set: { refreshToken: refresh_token },
      },
      { returnDocument: "after", runValidators: true },
    );
    res.cookie("actk", access_token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: in_production,
      sameSite: in_production ? "none" : "lax",
      domain: process.env.TOP_DOMAIN,
    });
    res.cookie("jwt", refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: in_production,
      sameSite: in_production ? "none" : "lax",
      domain: process.env.TOP_DOMAIN,
    });
    await redisConnect.set(
      `WhatsAppUserInfo-${updateRefreshToken!._id.toString()}`,
      JSON.stringify(updateRefreshToken),
      "EX",
      7 * 24 * 60 * 60,
    );
    return res.status(200).json({
      success: true,
      message: "Phone number verified",
      actk: access_token,
      user: {
        _id: updateRefreshToken!._id,
        name: updateRefreshToken!.name,
        email: updateRefreshToken!.email,
        phone: updateRefreshToken!.phone,
        phoneCode: updateRefreshToken!.phoneCode,
        pic: updateRefreshToken!.pic,
        banner: updateRefreshToken!.banner,
        bio: updateRefreshToken!.bio,
        lastSeen: updateRefreshToken!.lastSeen,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

export const handleRefresh = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt)
      return res.status(401).json({ message: "Cookie missing" });
    const findUser = await User.findOne({ refreshToken: cookies.jwt })
      .select("+refreshToken +_id")
      .lean();
    if (!findUser) {
      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: in_production,
        sameSite: in_production ? "none" : "lax",
        domain: process.env.TOP_DOMAIN,
      });
      res.clearCookie("actk", {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: in_production,
        sameSite: in_production ? "none" : "lax",
        domain: process.env.TOP_DOMAIN,
      });
      return res.status(401).json({ message: "You are not authorized !" });
    }
    const { refreshToken, ...other } = findUser;
    jwt.verify(
      findUser.refreshToken,
      process.env.REFRESH_TOKEN_KEY as string,
      (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err || findUser._id != decoded.id)
          return res.status(403).json({ status: false });
        const access_token = jwt.sign(
          { id: decoded.id },
          process.env.ACCESS_TOKEN_KEY as string,
          { expiresIn: "1d" },
        );
        res.cookie("actk", access_token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          secure: in_production,
          sameSite: in_production ? "none" : "lax",
          domain: process.env.TOP_DOMAIN,
        });
        return res.status(200).json({ actk: access_token });
      },
    );
  } catch (error) {
    getServerError(res, error, "handleRefresh controller");
  }
};
