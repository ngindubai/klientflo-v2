import { promises as fs } from "fs";
import path from "path";

// A pluggable blob store. The local adapter (below) writes to a gitignored
// `.uploads/` directory and works with no configuration. An S3 adapter
// implementing the same interface slots in when AWS creds are present
// (S3_BUCKET / AWS_*), using @aws-sdk/client-s3 + presigned URLs.
export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");
const META = ".meta.json";

class LocalStorage implements StorageAdapter {
  private async ensure() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
  async put(key: string, data: Buffer, contentType: string) {
    await this.ensure();
    await fs.writeFile(path.join(UPLOAD_DIR, key), data);
    await fs.writeFile(
      path.join(UPLOAD_DIR, key + META),
      JSON.stringify({ contentType }),
    );
  }
  async read(key: string) {
    try {
      const data = await fs.readFile(path.join(UPLOAD_DIR, key));
      let contentType = "application/octet-stream";
      try {
        const meta = JSON.parse(
          await fs.readFile(path.join(UPLOAD_DIR, key + META), "utf8"),
        );
        contentType = meta.contentType ?? contentType;
      } catch {
        // no meta — fall back to octet-stream
      }
      return { data, contentType };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    await fs.rm(path.join(UPLOAD_DIR, key), { force: true });
    await fs.rm(path.join(UPLOAD_DIR, key + META), { force: true });
  }
}

export function isS3Configured() {
  return Boolean(process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);
}

let storage: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storage) {
    // When isS3Configured(), construct an S3Storage here instead.
    storage = new LocalStorage();
  }
  return storage;
}
