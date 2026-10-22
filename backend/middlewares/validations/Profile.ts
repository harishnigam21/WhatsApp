import { NextFunction, Request, Response } from "express";
import { validateInput } from "./CommonValidation";

export const updateValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { pic, bio, name, banner } = req.body;
  if (validateInput("name", name, null, res)) return;
  if (pic && validateInput("image", pic, "pic", res)) return;
  if (banner && validateInput("image", banner, "banner", res)) return;
  console.log("Profile Validation done");
  next();
};
