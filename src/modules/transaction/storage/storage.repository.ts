import { Injectable } from '@nestjs/common';
import type { Transaction, TransactionType } from '../transaction.type';

@Injectable()
export class StorageRepository {
  private data: Transaction[] = [
    {
      id: 1,
      amount: 5000,
      date: new Date('2024-01-01'),
      category: 'Salary',
      type: 'income',
    },
    {
      id: 2,
      amount: 50,
      date: new Date('2024-01-02'),
      category: 'Food',
      type: 'expense',
    },
  ];

  getTransactions(): Transaction[] {
    return [...this.data];
  }

  getTransactionById(id: number): Transaction | null {
    return this.data.find((t) => t.id === id) ?? null;
  }

  getTransactionsByType(type: TransactionType): Transaction[] {
    return this.data.filter((transaction) => transaction.type === type);
  }

  deleteTransaction(id: number): void | -1 {
    const index = this.data.findIndex((t) => t.id === id);
    if (index === -1) {
      return -1;
    }

    this.data.splice(index, 1);
  }

  createNewTransaction(inf: Omit<Transaction, 'id' | 'date'>) {
    const last = this.data[this.data.length - 1];

    const newTransaction = {
      id: last !== undefined ? last.id + 1 : 1,
      amount: inf.amount,
      date: new Date(),
      category: inf.category,
      type: inf.type,
    } as Transaction;

    this.data.push(newTransaction);
    return newTransaction;
  }
}
