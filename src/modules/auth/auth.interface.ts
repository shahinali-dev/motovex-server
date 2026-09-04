import { Types } from "mongoose";
import { Role } from "../user/user.enum";

export interface IJWTPayload {
  _id: Types.ObjectId;
  email: string;
  role: Role;
}
