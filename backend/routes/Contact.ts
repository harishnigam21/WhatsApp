import express from "express";
import { createContact } from "../controllers/Contact";
import jwtVerifier from "../middlewares/jwt/jwtVerifier";

const router = express.Router();
router.route("/new").post(jwtVerifier, createContact);
export default router;
