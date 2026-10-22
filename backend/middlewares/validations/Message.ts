import { NextFunction, Request, Response } from "express";

export const MessageValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { message, media } = req.body;
  if (!message && media.length == 0)
    return res.status(400).json({ message: "Invalid Message" });
  if (message && message.trim().length == 0)
    return res.status(400).json({ message: "Invalid Message" });
  console.log("Message Validation done");
  next();
};
