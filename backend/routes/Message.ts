import express from "express";
import { sendMsg, startMsg, unStartMsg } from "../controllers/Message";
import jwtVerifier from "../middlewares/jwt/jwtVerifier";
const router = express.Router();
router.route("/send").post(jwtVerifier, sendMsg);
router.route("/unstar/:id").get(jwtVerifier, unStartMsg);
router.route("/star/:id").get(jwtVerifier, startMsg);
export default router;
