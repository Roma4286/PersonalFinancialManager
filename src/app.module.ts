import { Module } from '@nestjs/common';
import { TransactionModule } from './modules/transaction/transaction.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [PrismaModule, WalletModule, CategoryModule, TransactionModule],
})
export class AppModule {}
