import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";

// This middleware simply checks the id is valid or not & id is there or not in params.
const ValidateID = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    return res.status(422).json({ message: "Missing product ID" });
  }
  //mongoose.Types.ObjectId.isValid(id), provide by mongoose to validate id
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(417).json({
      success: false,
      message: "Invalid product ID format",
    });
  }
  console.log("Mongoose ID Verified");
  next();
};
export default ValidateID;
