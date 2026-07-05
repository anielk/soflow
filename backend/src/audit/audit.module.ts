import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuditEventListener } from './audit-event.listener';
import { AuditController } from './audit.controller';

@Module({
  controllers: [AuditController],
  providers: [PrismaService, AuditService, AuditEventListener],
  exports: [AuditService],
})
export class AuditModule {}
