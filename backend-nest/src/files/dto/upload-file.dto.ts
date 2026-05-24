import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsIn(['internal', 'external', 'confidential'])
  visibility?: 'internal' | 'external' | 'confidential';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
