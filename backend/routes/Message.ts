import express from "express";
import { sendMsg } from "../controllers/Message";
import jwtVerifier from "../middlewares/jwt/jwtVerifier";
const router = express.Router();
router.route("/send").post(jwtVerifier, sendMsg);
export default router;
