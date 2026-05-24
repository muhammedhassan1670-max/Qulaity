import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FilesService } from './files.service';

function ensureUploadsDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const filesLocalDir = process.env.FILES_LOCAL_DIR ?? 'uploads';
          const uploadsDir = join(
            process.cwd(),
            filesLocalDir,
          );
          ensureUploadsDir(uploadsDir);
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const safeExt = extname(file.originalname);
          const name = `${randomUUID()}${safeExt}`;
          cb(null, name);
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  )
  async upload(@UploadedFile() file: any, @Body() body: UploadFileDto) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const filesLocalDir = this.configService.get<string>('FILES_LOCAL_DIR') ?? 'uploads';

    const storedRelativePath = join(filesLocalDir, file.filename);

    const tags = Array.isArray(body.tags)
      ? body.tags
      : typeof (body as any).tags === 'string'
        ? String((body as any).tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

    const created = await this.filesService.createFromUpload({
      storedRelativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      visibility: body.visibility,
      tags,
    });

    return {
      id: created.id,
      storageProvider: created.storageProvider,
      storageKey: created.storageKey,
      originalName: created.originalName,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes.toString(),
      checksumSha256: created.checksumSha256,
      createdAt: created.createdAt,
    };
  }
}
