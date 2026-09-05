export interface IUploadedFile {
  url: string; // public URL the frontend can use directly
  path: string; // internal reference used to delete the file later
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Storage is behind this interface on purpose: today `LocalStorageService`
 * just writes to disk under UPLOAD_DIR and serves it via `/uploads` static
 * middleware (see app.ts). When the app moves to S3/R2, only
 * `src/utils/storage/index.ts` needs to change (point `storageService` at a
 * new `S3StorageService implements IStorageService`) — every call site
 * (purchase.service.ts etc.) stays exactly the same.
 */
export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder: string): Promise<IUploadedFile>;
  deleteFile(path: string): Promise<void>;
}
