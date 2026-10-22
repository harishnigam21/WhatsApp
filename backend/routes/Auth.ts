import express from "express";
import { handleRefresh, sendOTPCon, verifyOTPCon } from "../controllers/Auth";
const router = express.Router();
router.route("/send-otp").post(sendOTPCon);
router.route("/verify-otp").post(verifyOTPCon);
router.route("/refresh").get(handleRefresh);
export default router;
