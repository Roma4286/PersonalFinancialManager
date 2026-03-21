import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { StorageRepository } from './storage/storage.repository';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, StorageRepository],
})
export class TransactionModule {}
