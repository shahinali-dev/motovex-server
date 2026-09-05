import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DB_URL: z.string().min(1, "DB_URL is required"),

  PORT: z.coerce.number().default(5000),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  SALT_ROUNDS: z.coerce.number().default(10),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),

  JWT_ACCESS_EXPIRE_IN: z.string().min(1, "JWT_ACCESS_EXPIRE_IN is required"),

  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),

  JWT_REFRESH_EXPIRE_IN: z.string().min(1, "JWT_REFRESH_EXPIRE_IN is required"),

  JWT_VERIFY_SECRET: z.string().min(1).default("verify-secret-change-me"),

  JWT_VERIFY_EXPIRE_IN: z.string().min(1).default("10m"),

  OTP_EXPIRES_MIN: z.coerce.number().default(5),

  ACCESS_COOKIE_EXPIRES_MS: z.coerce.number().default(24 * 60 * 60 * 1000),

  REFRESH_COOKIE_EXPIRES_MS: z.coerce
    .number()
    .default(7 * 24 * 60 * 60 * 1000),

  VERIFY_COOKIE_EXPIRES_MS: z.coerce.number().default(10 * 60 * 1000),

  // Optional: only set in production if cookies must be shared across subdomains
  // e.g. ".yourdomain.com". Leave unset for normal same-site/API-only deployments.
  COOKIE_DOMAIN: z.string().optional(),

  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),

  APP_EMAIL: z.string().min(1, "APP_EMAIL is required"),
  APP_PASSWORD: z.string().min(1, "APP_PASSWORD is required"),

  // Local disk storage for uploads today; swap the storage.service
  // implementation for S3/R2 later without touching call sites.
  UPLOAD_DIR: z.string().default("uploads"),
  APP_BASE_URL: z.string().default("http://localhost:5000"),

  SEED_ADMIN_NAME: z.string().min(1, "SEED_ADMIN_NAME is required"),

  SEED_ADMIN_EMAIL: z.string().email("SEED_ADMIN_EMAIL must be a valid email"),

  SEED_ADMIN_PASSWORD: z
    .string()
    .min(6, "SEED_ADMIN_PASSWORD must be at least 6 characters"),
});

const env = envSchema.parse(process.env);

export default {
  DB: env.DB_URL,

  PORT: env.PORT,

  NODE_ENV: env.NODE_ENV,

  SALT_ROUNDS: env.SALT_ROUNDS,

  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,

  JWT_ACCESS_EXPIRE_IN: env.JWT_ACCESS_EXPIRE_IN,

  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,

  JWT_REFRESH_EXPIRE_IN: env.JWT_REFRESH_EXPIRE_IN,

  JWT_VERIFY_SECRET: env.JWT_VERIFY_SECRET,

  JWT_VERIFY_EXPIRE_IN: env.JWT_VERIFY_EXPIRE_IN,

  OTP_EXPIRES_MIN: env.OTP_EXPIRES_MIN,

  ACCESS_COOKIE_EXPIRES_MS: env.ACCESS_COOKIE_EXPIRES_MS,

  REFRESH_COOKIE_EXPIRES_MS: env.REFRESH_COOKIE_EXPIRES_MS,

  VERIFY_COOKIE_EXPIRES_MS: env.VERIFY_COOKIE_EXPIRES_MS,

  COOKIE_DOMAIN: env.COOKIE_DOMAIN,

  CORS_ORIGIN: env.CORS_ORIGIN,

  APP_EMAIL: env.APP_EMAIL,
  APP_PASSWORD: env.APP_PASSWORD,

  UPLOAD_DIR: env.UPLOAD_DIR,
  APP_BASE_URL: env.APP_BASE_URL,

  SEED_ADMIN_NAME: env.SEED_ADMIN_NAME,

  SEED_ADMIN_EMAIL: env.SEED_ADMIN_EMAIL,

  SEED_ADMIN_PASSWORD: env.SEED_ADMIN_PASSWORD,
};
