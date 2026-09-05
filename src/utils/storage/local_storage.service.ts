import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import config from "../../config";
import { IStorageService, IUploadedFile } from "./storage.interface";

const UPLOAD_ROOT = path.resolve(process.cwd(), config.UPLOAD_DIR);

export class LocalStorageService implements IStorageService {
  async uploadFile(
    file: Express.Multer.File,
    folder: string
  ): Promise<IUploadedFile> {
    const dir = path.join(UPLOAD_ROOT, folder);
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const absolutePath = path.join(dir, filename);

    await fs.writeFile(absolutePath, file.buffer);

    const relativePath = path.join(folder, filename).split(path.sep).join("/");

    return {
      url: `${config.APP_BASE_URL}/uploads/${relativePath}`,
      path: relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  async deleteFile(relativePath: string): Promise<void> {
    const absolutePath = path.join(UPLOAD_ROOT, relativePath);
    await fs.unlink(absolutePath).catch(() => {
      // File already gone — nothing to do.
    });
  }
}
