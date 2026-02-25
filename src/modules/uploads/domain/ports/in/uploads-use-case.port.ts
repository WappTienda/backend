export const UPLOADS_USE_CASE = Symbol('UPLOADS_USE_CASE');

export interface UploadsUseCasePort {
  uploadImage(file: Express.Multer.File, folder?: string): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
}
