import { Injectable } from '@nestjs/common';
import { FinancialAnalyzer } from './financialAnalyzer.js';
import * as fs from 'node:fs';
import { TransactionDto } from './dto/create-transaction.dto.js';

@Injectable()
export class AppService {
  private analyzer: FinancialAnalyzer;
  constructor() {
    this.analyzer = new FinancialAnalyzer(
      JSON.parse(fs.readFileSync('transactions.json', { encoding: 'utf-8' })),
    );
  }

  getAllTransactions() {
    return this.analyzer.getTransactions();
  }

  getOneTransaction(transactionId: number) {
    const result = this.analyzer.getTransactions(transactionId)[0];
    if (result === undefined) {
      return null;
    }
    return result;
  }

  getBalance() {
    return this.analyzer.getTotalBalance();
  }

  createNewTransaction(dto: TransactionDto) {
    return this.analyzer.createNewTransaction(dto);
  }

  deleteTransaction(transactionId: number): -1 | void {
    return this.analyzer.deleteTransaction(transactionId);
  }
}
