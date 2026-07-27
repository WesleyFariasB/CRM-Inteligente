import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
@Module({
  imports: [AuditModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
})
export class OpportunitiesModule {}
