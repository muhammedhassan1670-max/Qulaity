import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditsAliasController } from './audits-alias.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [AuditController, AuditsAliasController],
  providers: [AuditService],
})
export class AuditModule {}
