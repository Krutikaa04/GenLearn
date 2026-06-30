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
    await fs.rename(file.path, destination);

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
