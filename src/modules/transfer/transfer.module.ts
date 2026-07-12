import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { KyselyModule } from '../kysely/kysely.module';

@Module({
  controllers: [TransferController],
  providers: [TransferService],
  imports: [KyselyModule],
})
export class TransferModule {}
