import { Module } from '@nestjs/common';
import { StorageModule } from './modules/transaction/storage/storage.module';
import { TransactionModule } from './modules/transaction/transaction.module';

@Module({
  imports: [StorageModule, TransactionModule],
})
export class AppModules {}
