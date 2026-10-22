import express from "express";
import jwtVerifier from "../middlewares/jwt/jwtVerifier";
import { getChat } from "../controllers/Chat";
const router = express.Router();
router.route("/:id").get(jwtVerifier, getChat);
export default router;
