import { Module } from '@nestjs/common';
import { TransactionModule } from './modules/transaction/transaction.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [TransactionModule, PrismaModule],
})
export class AppModule {}
