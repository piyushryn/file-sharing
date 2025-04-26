import { Request } from "express";
import { VerifyRazorpayRequestBody } from "../../controllers/paymentController";
import UserModel from "../../models/UserModel";

const getUser = (
  req: Request<{}, {}, VerifyRazorpayRequestBody, any, Record<string, any>>
) => {
  if (req.user) {
    return req.user;
  }
  return null;
};

export default getUser;
