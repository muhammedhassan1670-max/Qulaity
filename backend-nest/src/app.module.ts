import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FilesModule } from './files/files.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { NcrModule } from './ncr/ncr.module';
import { CapaModule } from './capa/capa.module';
import { AuditModule } from './audit/audit.module';
import { FmeaModule } from './fmea/fmea.module';
import { SupplierModule } from './supplier/supplier.module';
import { EightDModule } from './eight-d/eight-d.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ProductionLayoutModule } from './production-layout/production-layout.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SpcModule } from './spc/spc.module';
import { IoTModule } from './iot/iot.module';
import { WebSocketModule } from './websocket/websocket.module';
import { CompatibilityModule } from './compatibility/compatibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['env.local'],
    }),
    PrismaModule,
    FilesModule,
    ReportsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    NcrModule,
    CapaModule,
    AuditModule,
    FmeaModule,
    SupplierModule,
    EightDModule,
    ComplaintsModule,
    ProductionLayoutModule,
    DashboardModule,
    SpcModule,
    IoTModule,
    CompatibilityModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
