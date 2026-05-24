import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createFromUpload(params: {
    storedRelativePath: string;
    originalName: string;
    mimeType?: string;
    sizeBytes: number;
    visibility?: 'internal' | 'external' | 'confidential';
    tags?: string[];
    uploadedById?: string;
  }) {
    const localFullPath = join(process.cwd(), params.storedRelativePath);

    let checksumSha256: string | undefined;
    try {
      const buf = await readFile(localFullPath);
      checksumSha256 = createHash('sha256').update(buf).digest('hex');
    } catch {
      checksumSha256 = undefined;
    }

    const file = await this.prisma.file.create({
      data: {
        storageProvider: 'local',
        bucket: null,
        storageKey: params.storedRelativePath.replace(/\\/g, '/'),
        originalName: params.originalName,
        mimeType: params.mimeType ?? null,
        sizeBytes: BigInt(params.sizeBytes),
        checksumSha256: checksumSha256 ?? null,
        uploadedById: params.uploadedById ?? null,
        visibility: params.visibility ?? 'internal',
        tags: params.tags ?? [],
        metadata: {},
      },
    });

    return file;
  }
}
