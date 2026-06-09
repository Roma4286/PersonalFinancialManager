import { Module } from '@nestjs/common';
import { KyselyService } from './kysely.service';

@Module({
  providers: [KyselyService],
  exports: [KyselyService],
})
export class KyselyModule {}
