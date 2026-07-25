import { Module } from '@nestjs/common';
import { TransactionModule } from './modules/transaction/transaction.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CategoryModule } from './modules/category/category.module';
import { TransferModule } from './modules/transfer/transfer.module';

@Module({
  imports: [WalletModule, CategoryModule, TransactionModule, TransferModule],
})
export class AppModule {}
