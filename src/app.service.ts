import { Injectable } from '@nestjs/common';
import { FinancialAnalyzerService } from './modules/financial-analyzer/financial-analyzer.service.ts';
import { TransactionDto } from './dto/create-transaction.dto.js';
import { StorageService } from './modules/storage/storage.service.ts';

@Injectable()
export class AppService {
  constructor(
    private analyzer: FinancialAnalyzerService,
    private dataStorage: StorageService,
  ) {}

  getAllTransactions() {
    return this.dataStorage.getTransactions();
  }

  getOneTransaction(transactionId: number) {
    const result = this.dataStorage.getTransactionById(transactionId);
    if (result === undefined) {
      return null;
    }
    return result;
  }

  getBalance() {
    return this.analyzer.calculateTotalBalance(
      this.dataStorage.getTransactionsByType('income'),
      this.dataStorage.getTransactionsByType('expense'),
    );
  }

  createNewTransaction(dto: TransactionDto) {
    return this.dataStorage.createNewTransaction(dto);
  }

  deleteTransaction(transactionId: number): -1 | void {
    return this.dataStorage.deleteTransaction(transactionId);
  }
}
