import jwt, { SignOptions } from "jsonwebtoken";
import { IJWTPayload } from "../modules/auth/auth.interface";

const createToken = (
  jwtPayload: IJWTPayload,
  secret: string,
  expiresIn: string
) => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(jwtPayload, secret, options);
};

export default createToken;
