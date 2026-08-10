import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  // Docker (CWD=/app) → /app/uploads, mounted as shared volume with ai-service.
  // Local dev (CWD=backend/) → backend/uploads/.
  private readonly baseDir = path.resolve(process.cwd(), 'uploads');

  async saveFile(
    file: Express.Multer.File,
    studentId: string,
    documentId: string,
  ): Promise<string> {
    const dir = path.join(this.baseDir, studentId, documentId);
    await fs.mkdir(dir, { recursive: true });

    const destination = path.join(dir, file.originalname);

    // Multer writes the upload to the OS temp dir (os.tmpdir()), which on most
    // PaaS containers (Render included) is a *different* mount than the project
    // directory where `uploads/` lives. `fs.rename` cannot move a file across
    // filesystems — it throws EXDEV — so every upload would fail with a 500.
    // Copy-then-unlink works regardless of whether src and dst share a device.
    try {
      await fs.rename(file.path, destination);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
        await fs.copyFile(file.path, destination);
        await fs.unlink(file.path).catch(() => {});
      } else {
        throw err;
      }
    }

    return destination;
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
      // Best-effort: remove empty parent directory
      const dir = path.dirname(storagePath);
      await fs.rmdir(dir).catch(() => {});
    } catch (err) {
      this.logger.warn(`Could not delete file at ${storagePath}: ${(err as Error).message}`);
    }
  }

  getUploadsDir(): string {
    return this.baseDir;
  }
}
