import { NextFunction, Response } from "express";
import User from "../../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../types/AuthRequest";
import redisConnect from "../../config/redis_connect";
//This middleware checks request by accessing their token attached at req header, using jwt.verify it will verify and return result as per token validation. If token validates user can move forward otherwise unauthorized.
const jwtVerifier = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers["authorization"];
    if (!header) {
      return res.status(400).json({
        message: "Looks Like you have not login yet",
        issue: "not verified",
      });
    }
    const token = header.split(" ")[1]; // bearer token...
    if (!token) {
      return res
        .status(403)
        .json({ message: "Invalid token format", issue: "not verified" });
    }
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_KEY as string,
    ) as { id: string };
    const getUser = await redisConnect.get(`WhatsAppUserInfo-${decoded.id}`);
    if (!getUser) {
      const UserExist = await User.findById(decoded.id).lean();
      if (!UserExist) {
        console.error("2.2 User no longer exists");
        return res
          .status(404)
          .json({ message: "User no longer exists", issue: "not verified" });
      }
      const eUser = {
        _id: UserExist._id.toString(),
        name: UserExist.name,
        email: UserExist.email,
        phone: UserExist.phone,
        phoneCode: UserExist.phoneCode,
        pic: UserExist?.pic || null,
        banner: UserExist?.banner || null,
        bio: UserExist.bio,
        lastSeen: UserExist.lastSeen,
      };
      await redisConnect.set(
        `WhatsAppUserInfo-${eUser._id}`,
        JSON.stringify(eUser),
        "EX",
        7 * 24 * 60 * 60,
      );
      req.user = eUser;
      req.actk = token;
    } else {
      req.user = JSON.parse(getUser);
    }

    next();
  } catch (err) {
    //All kind of jwt error is handled
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).send({
        error: "Auth token expired. Please refresh.",
        issue: "token expired",
      });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      if (err.message === "invalid signature") {
        return res
          .status(403)
          .send({ error: "Security alert: Invalid signature." });
      }
      return res.status(400).send({ error: "Token is malformed or invalid." });
    }
    if (err instanceof jwt.NotBeforeError) {
      return res
        .status(403)
        .send({ error: "Token not active yet. Check your system clock." });
    }
    console.error("Verifier Side Error : ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export default jwtVerifier;
