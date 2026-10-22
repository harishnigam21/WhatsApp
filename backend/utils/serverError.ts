import { Response } from "express";
import mongoose from "mongoose";

export const getServerError = (res: Response, error: unknown, from: string) => {
  if (error instanceof Error) {
    console.error(`Error occurred at ${from} : `, error);
    if (error.message == "DFN") {
      return res.status(403).json({
        message: "Farm Name with same name is not allowed",
      });
    }
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const formattedErrors: Record<string, string> = {};
    Object.keys(error.errors).forEach((key) => {
      formattedErrors[key] = error.errors[key].message;
    });
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: formattedErrors,
    });
  }
  const mongoError = error as { code?: number; keyValue?: Record<string, any> };
  if (mongoError && mongoError.code === 11000) {
    const formattedErrors: Record<string, string> = {};
    if (mongoError.keyValue) {
      Object.keys(mongoError.keyValue).forEach((key) => {
        formattedErrors[key] =
          `The ${key} '${mongoError.keyValue?.[key]}' already exists.`;
      });
    }
    return res.status(400).json({
      success: false,
      message: "Duplicate Field Error",
      errors: formattedErrors,
    });
  }
  return res.status(500).json({ message: "Internal Server Error" });
};
