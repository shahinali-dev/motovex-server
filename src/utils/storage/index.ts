import { LocalStorageService } from "./local_storage.service";
import { IStorageService } from "./storage.interface";

// Single switch-point for moving off local disk to S3/R2 later:
//   export const storageService: IStorageService = new S3StorageService();
export const storageService: IStorageService = new LocalStorageService();

export * from "./storage.interface";
