import { Module } from '@nestjs/common';
import { TransactionModule } from './modules/transaction/transaction.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [WalletModule, CategoryModule, TransactionModule],
})
export class AppModule {}
