import { IsEnum, IsOptional, IsString, IsUUID, IsDateString, IsNumber, IsDecimal, Min, Max } from 'class-validator';
import { RecordStatus, AuditType, PriorityLevel } from '../../generated/enums';

export class CreateAuditDto {
  @IsString()
  auditNumber!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsEnum(AuditType)
  type!: AuditType;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsUUID()
  plantId!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsUUID()
  leadAuditorUserId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateAuditDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsEnum(AuditType)
  type?: AuditType;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsUUID()
  leadAuditorUserId?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  score?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AuditQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsEnum(AuditType)
  type?: AuditType;

  @IsOptional()
  @IsUUID()
  plantId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  leadAuditorUserId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
