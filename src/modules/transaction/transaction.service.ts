import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { TransactionType } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  async getAllTransactions() {
    return await this.transactionRepository.getTransactions();
  }

  async getTransactionById(transactionId: number) {
    return await this.transactionRepository.getTransactionById(transactionId);
  }

  async getBalance() {
    const income = await this.transactionRepository.getTransactionsByType(
      TransactionType.INCOME,
    );
    const expense = await this.transactionRepository.getTransactionsByType(
      TransactionType.EXPENSE,
    );
    const totalIncome = income.reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      0,
    );
    const totalExpense = expense.reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      0,
    );
    return totalIncome - totalExpense;
  }

  async createNewTransaction(dto: CreateTransactionDto) {
    return await this.transactionRepository.createNewTransaction(dto);
  }

  async deleteTransaction(transactionId: number) {
    return await this.transactionRepository.deleteTransactionById(
      transactionId,
    );
  }
}
