import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from './modules/transaction/transaction.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WalletModule,
    CategoryModule,
    TransactionModule,
  ],
})
export class AppModule {}
