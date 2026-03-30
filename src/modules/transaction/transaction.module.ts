import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionRepository } from './transaction.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository],
  imports: [PrismaModule],
})
export class TransactionModule {}
