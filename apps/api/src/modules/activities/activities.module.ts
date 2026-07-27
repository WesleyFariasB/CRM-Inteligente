import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
@Module({
  imports: [AuditModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
