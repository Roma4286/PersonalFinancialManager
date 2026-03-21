import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { StorageRepository } from './storage/storage.repository';
import { TransactionType } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(private transactionStorage: StorageRepository) {}

  getAllTransactions() {
    return this.transactionStorage.getTransactions();
  }

  getTransactionById(transactionId: number) {
    const result = this.transactionStorage.getTransactionById(transactionId);
    if (result === undefined) {
      return null;
    }
    return result;
  }

  getBalance() {
    const income = this.transactionStorage.getTransactionsByType(
      TransactionType.INCOME,
    );
    const expense = this.transactionStorage.getTransactionsByType(
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

  createNewTransaction(dto: CreateTransactionDto) {
    return this.transactionStorage.createNewTransaction(dto);
  }

  deleteTransaction(transactionId: number): void | false {
    return this.transactionStorage.deleteTransaction(transactionId);
  }
}
