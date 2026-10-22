import { Express } from "express";
export const convertToDataUri = (file: Express.Multer.File) => {
  const base64Content = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${base64Content}`;
};
