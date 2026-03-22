import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { TransactionType } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  getAllTransactions() {
    return this.transactionRepository.getTransactions();
  }

  getTransactionById(transactionId: number) {
    return this.transactionRepository.getTransactionById(transactionId);
  }

  getBalance() {
    const income = this.transactionRepository.getTransactionsByType(
      TransactionType.INCOME,
    );
    const expense = this.transactionRepository.getTransactionsByType(
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
    return this.transactionRepository.createNewTransaction(dto);
  }

  deleteTransaction(transactionId: number): boolean {
    return this.transactionRepository.deleteTransaction(transactionId);
  }
}
