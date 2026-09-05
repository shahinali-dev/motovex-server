import httpStatus from "http-status";
import { Types } from "mongoose";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import createToken from "../../utils/create_token";
import generateOtp from "../../utils/otp_utils";
import passwordUtils from "../../utils/password_utils";
import { EmailService } from "../../utils/email/email.service";
import { ISignIn } from "../user/user.interface";
import UserModel from "../user/user.model";
import { userService } from "../user/user.service";
import { IJWTPayload } from "./auth.interface";

export class AuthService {
  private issueTokens(jwtPayload: IJWTPayload) {
    const accessToken = createToken(
      jwtPayload,
      config.JWT_ACCESS_SECRET as string,
      config.JWT_ACCESS_EXPIRE_IN as string
    );

    const refreshToken = createToken(
      jwtPayload,
      config.JWT_REFRESH_SECRET as string,
      config.JWT_REFRESH_EXPIRE_IN as string
    );

    return { accessToken, refreshToken };
  }

  private issueVerifyToken(jwtPayload: IJWTPayload) {
    return createToken(
      jwtPayload,
      config.JWT_VERIFY_SECRET as string,
      config.JWT_VERIFY_EXPIRE_IN as string
    );
  }

  async signIn(payload: ISignIn) {
    const existingUser = await userService.isExist(payload.email);
    if (!existingUser) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    if (!existingUser.isActive) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "This account has been deactivated. Contact an admin."
      );
    }

    const isMatch = await passwordUtils.compare(
      payload.password,
      existingUser.password
    );

    if (!isMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    const jwtPayload: IJWTPayload = {
      _id: existingUser._id as Types.ObjectId,
      email: existingUser.email,
      role: existingUser.role,
    };

    if (!existingUser.isVerified) {
      const { otp, otpExpires } = generateOtp();
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save({ validateBeforeSave: false });

      await EmailService.sendOTPEmail(existingUser.email, existingUser.name, otp);

      const verifyToken = this.issueVerifyToken(jwtPayload);
      return { requiresVerification: true as const, verifyToken };
    }

    const { password, otp, otpExpires, resetPasswordOtp, resetPasswordOtpExpires, ...rest } =
      existingUser.toJSON();

    const { accessToken, refreshToken } = this.issueTokens(jwtPayload);

    return {
      requiresVerification: false as const,
      user: rest,
      accessToken,
      refreshToken,
    };
  }

  async verifyOTP(userId: string, email: string, otp: string) {
    const user = await UserModel.findOne({ _id: userId, email }).select(
      "+otp +otpExpires"
    );
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!user.otp || !user.otpExpires) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No OTP requested. Please resend OTP first."
      );
    }

    if (user.otpExpires.getTime() < Date.now()) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired");
    }

    if (user.otp !== otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateBeforeSave: false });

    const jwtPayload: IJWTPayload = {
      _id: user._id as Types.ObjectId,
      email: user.email,
      role: user.role,
    };
    const { accessToken, refreshToken } = this.issueTokens(jwtPayload);

    const { password, ...rest } = user.toJSON();

    return {
      message: "Account verified successfully",
      data: { user: rest, accessToken, refreshToken },
    };
  }

  async resendOTP(userId: string, email: string) {
    const user = await UserModel.findOne({ _id: userId, email });
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    await EmailService.sendOTPEmail(user.email, user.name, otp, true);

    return { message: "OTP resent successfully", data: null };
  }

  async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email });
    // Always return a generic success message — don't leak whether the
    // email exists in the system.
    if (!user) {
      return {
        message: "If that email exists, a reset code has been sent",
        data: null,
      };
    }

    const { otp, otpExpires } = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    await EmailService.sendPasswordResetOTPEmail(user.email, user.name, otp);

    return {
      message: "If that email exists, a reset code has been sent",
      data: null,
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await UserModel.findOne({ email }).select(
      "+resetPasswordOtp +resetPasswordOtpExpires"
    );
    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or OTP");
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No password reset requested for this email"
      );
    }

    if (user.resetPasswordOtpExpires.getTime() < Date.now()) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired");
    }

    if (user.resetPasswordOtp !== otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    return { message: "Password reset successfully", data: null };
  }

  async getAuthUser(id: Types.ObjectId) {
    const user = await UserModel.findById(id);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user;
  }
}

export const authService = new AuthService();
