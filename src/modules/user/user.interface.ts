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

  // Email verification (OTP sent on signup / unverified sign-in)
  isVerified?: boolean;
  otp?: string | null;
  otpExpires?: Date | null;

  // Forgot / reset password (OTP sent to email)
  resetPasswordOtp?: string | null;
  resetPasswordOtpExpires?: Date | null;

  // Field-force (SR/DSR/DM) hierarchy & territory, used for
  // delivery assignment and SR/DSR/DM-wise reporting.
  territory?: string;
  reportsTo?: Types.ObjectId | null;
}

export interface ISignIn {
  email: string;
  password: string;
}

export interface IForgotPassword {
  email: string;
}

export interface IResetPassword {
  email: string;
  otp: string;
  newPassword: string;
}
