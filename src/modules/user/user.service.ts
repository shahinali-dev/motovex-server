import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import { IUser } from "./user.interface";
import UserModel from "./user.model";

export class UserService {
  async isExist(email: string) {
    return UserModel.findOne({ email }).select("+password");
  }

  async createUser(payload: IUser) {
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) {
      throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
    }
    const user = await UserModel.create({
      isVerified: true,
      ...payload,
    });
    return UserModel.findById(user._id);
  }

  async getAllUsers(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUserById(id: string | Types.ObjectId) {
    const user = await UserModel.findById(id);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user;
  }

  async updateUser(id: string, payload: Partial<IUser>) {
    const user = await UserModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user;
  }

  async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user;
  }
}

export const userService = new UserService();
