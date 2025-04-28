import { Request } from "express";
import { VerifyRazorpayRequestBody } from "../../controllers/paymentController";

const getUser = (
  req: Request<{}, {}, VerifyRazorpayRequestBody, any, Record<string, any>>
) => {
  if (req.user) {
    return req.user;
  }
  return null;
};

export default getUser;
