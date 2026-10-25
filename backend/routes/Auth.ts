import express from "express";
import {
  handleRefresh,
  Login,
  sendOTPCon,
  verifyOTPCon,
} from "../controllers/Auth";
const router = express.Router();
router.route("/send-otp").post(sendOTPCon);
router.route("/login").post(Login);
router.route("/verify-otp").post(verifyOTPCon);
router.route("/refresh").get(handleRefresh);
export default router;
