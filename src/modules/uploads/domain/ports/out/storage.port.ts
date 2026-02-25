export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  upload(key: string, body: Buffer, contentType: string): Promise<string>;

  delete(imageUrl: string): Promise<void>;
}
