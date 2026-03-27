import { Module } from '@nestjs/common';
import { TransactionModule } from './modules/transaction/transaction.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [TransactionModule, PrismaModule],
})
export class AppModule {}
