import bcrypt from "bcrypt";
import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../errors/app_error";
const hashedPassword = (password: string): Promise<string> => {
  const hash = bcrypt.hash(password, Number(config.SALT_ROUNDS));
  if (!hash)
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to hash password"
    );
  return hash;
};

const comparePassword = async (password: string, hash: string) => {
  const isMatch = await bcrypt.compare(password, hash);

  return isMatch;
};

const passwordUtils = {
  hash: hashedPassword,
  compare: comparePassword,
};

export default passwordUtils;
