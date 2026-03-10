import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { StorageRepository } from './storage/storage.repository';

@Injectable()
export class TransactionService {
  constructor(private TransactionStorage: StorageRepository) {}

  getAllTransactions() {
    return this.TransactionStorage.getTransactions();
  }

  getOneTransaction(transactionId: number) {
    const result = this.TransactionStorage.getTransactionById(transactionId);
    if (result === undefined) {
      return null;
    }
    return result;
  }

  getBalance() {
    const income = this.TransactionStorage.getTransactionsByType('income');
    const expense = this.TransactionStorage.getTransactionsByType('expense');
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
    return this.TransactionStorage.createNewTransaction(dto);
  }

  deleteTransaction(transactionId: number): -1 | void {
    return this.TransactionStorage.deleteTransaction(transactionId);
  }
}
