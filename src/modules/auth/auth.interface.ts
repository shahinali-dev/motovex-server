import { Types } from "mongoose";
import { Role } from "../user/user.enum";

export interface IJWTPayload {
  _id: Types.ObjectId;
  email: string;
  role: Role;
}

export interface ISignInResult {
  requiresVerification: false;
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

export interface ISignInRequiresVerification {
  requiresVerification: true;
  verifyToken: string;
}
