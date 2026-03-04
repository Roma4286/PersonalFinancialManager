import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancialAnalyzer } from './financialAnalyzer.js';
import * as fs from 'node:fs';
import { TransactionDto } from './dto/transaction.dto.js';

@Injectable()
export class AppService {
  private analyzer: FinancialAnalyzer;
  constructor() {
    this.analyzer = new FinancialAnalyzer(
      JSON.parse(fs.readFileSync('transactions.json', { encoding: 'utf-8' }))
    );
  }

  getAllTransactions() {
    return this.analyzer.getTransactions();
  }

  getOneTransaction(transactionId: number) {
    if (transactionId < 0) {
      throw new BadRequestException('id must be >= 0');
    }
    const response = this.analyzer.getTransactions(transactionId);

    if (response.length === 0) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`
      );
    }

    return response;
  }

  getBalance() {
    return this.analyzer.getTotalBalance();
  }

  createNewTransaction(dto: TransactionDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be > 0');
    }
    return this.analyzer.createNewTransaction(dto);
  }

  deleteTransaction(transactionId: number) {
    if (transactionId < 0) {
      throw new BadRequestException('id must be >= 0');
    }

    if (this.analyzer.deleteTransaction(transactionId) === -1) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`
      );
    }
    return [];
  }
}
