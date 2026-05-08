import { Module } from '@nestjs/common';
import { TransactionModule } from './modules/transaction/transaction.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CategoryModule } from './modules/category/category.module';
import { KyselyModule } from './modules/kysely/kyselu.module';

@Module({
  imports: [
    PrismaModule,
    KyselyModule,
    WalletModule,
    CategoryModule,
    TransactionModule,
  ],
})
export class AppModule {}
