import mongoose from "mongoose";
import config from "../config";
import { Role } from "../modules/user/user.enum";
import UserModel from "../modules/user/user.model";

async function seedAdmin() {
  await mongoose.connect(config.DB as string);

  const email = config.SEED_ADMIN_EMAIL as string;
  const existing = await UserModel.findOne({ email });

  if (existing) {
    console.log(`Admin with email ${email} already exists. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  await UserModel.create({
    name: config.SEED_ADMIN_NAME || "Motovex Admin",
    email,
    password: config.SEED_ADMIN_PASSWORD,
    role: Role.ADMIN,
    isVerified: true,
  });

  console.log(`Admin user created: ${email}`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
