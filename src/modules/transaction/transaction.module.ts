import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { KyselyModule } from '../kysely/kysely.module';
import { WalletModule } from '../wallet/wallet.module';
import { CategoryModule } from '../category/category.module';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService],
  imports: [KyselyModule, WalletModule, CategoryModule],
})
export class TransactionModule {}
