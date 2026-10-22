import express from "express";
import multer from "multer";
import jwtVerifier from "../middlewares/jwt/jwtVerifier";
import {
  getActiveContacts,
  getAllUsers,
  getContacts,
  getRelativeUsers,
  getUser,
  getUserMeta,
  newUser,
} from "../controllers/Users";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();
router.route("/new").post(
  upload.fields([
    { name: "pic", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  newUser,
);
router.route("/").get(jwtVerifier, getUser);
router.route("/meta/:id").get(jwtVerifier, getUserMeta);
router.route("/contacts").get(jwtVerifier, getContacts);
router.route("/active-contacts").get(jwtVerifier, getActiveContacts);
router.route("/all").get(jwtVerifier, getAllUsers);
router.route("/relative").get(jwtVerifier, getRelativeUsers);
export default router;
