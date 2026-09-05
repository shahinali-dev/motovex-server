import bcrypt from "bcrypt";
import { model, Schema } from "mongoose";
import config from "../../config";
import { Role } from "./user.enum";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.STAFF,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },

    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false, default: null },
    otpExpires: { type: Date, select: false, default: null },

    resetPasswordOtp: { type: String, select: false, default: null },
    resetPasswordOtpExpires: { type: Date, select: false, default: null },

    territory: { type: String, trim: true },
    reportsTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.SALT_ROUNDS)
    );
  }
  next();
});

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
