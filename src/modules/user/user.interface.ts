/* eslint-disable no-unused-vars */
import { Types } from "mongoose";
import { Role } from "./user.enum";

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  role: Role;
  password: string;
  phone?: string;
  isActive?: boolean;
}

export interface ISignIn {
  email: string;
  password: string;
}
