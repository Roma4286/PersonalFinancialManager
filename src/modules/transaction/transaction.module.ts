import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { StorageModule } from './storage/storage.module';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService],
  imports: [StorageModule],
})
export class TransactionModule {}
