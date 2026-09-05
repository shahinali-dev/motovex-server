import config from "../config";

/**
 * Generates a 6-digit numeric OTP and its expiry Date, based on
 * `OTP_EXPIRES_MIN` from the environment (default 5 minutes).
 */
const generateOtp = () => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpires = new Date(
    Date.now() + Number(config.OTP_EXPIRES_MIN) * 60 * 1000
  );
  return { otp, otpExpires };
};

export default generateOtp;
