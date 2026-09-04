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

  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),

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

  CORS_ORIGIN: env.CORS_ORIGIN,

  SEED_ADMIN_NAME: env.SEED_ADMIN_NAME,

  SEED_ADMIN_EMAIL: env.SEED_ADMIN_EMAIL,

  SEED_ADMIN_PASSWORD: env.SEED_ADMIN_PASSWORD,
};
``;
