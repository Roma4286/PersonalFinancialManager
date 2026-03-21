import { Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from '../transaction.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class StorageRepository {
  private data: Transaction[] = [
    {
      id: 1,
      amount: 5000,
      date: new Date('2024-01-01'),
      category: 'Salary',
      type: TransactionType.INCOME,
    },
    {
      id: 2,
      amount: 50,
      date: new Date('2024-01-02'),
      category: 'Food',
      type: TransactionType.EXPENSE,
    },
  ];

  getTransactions(): Transaction[] {
    return structuredClone(this.data);
  }

  getTransactionById(id: number): Transaction | null {
    return this.data.find((t) => t.id === id) ?? null;
  }

  getTransactionsByType(type: TransactionType): Transaction[] {
    return structuredClone(
      this.data.filter((transaction) => transaction.type === type),
    );
  }

  deleteTransaction(id: number): void | false {
    const index = this.data.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }

    this.data.splice(index, 1);
  }

  createNewTransaction(newTransactionParams: CreateTransactionDto) {
    const last =
      this.data.length !== 0 ? Math.max(...this.data.map((t) => t.id)) : 0;

    const newTransaction = {
      id: last + 1,
      amount: newTransactionParams.amount,
      date: new Date(),
      category: newTransactionParams.category,
      type: newTransactionParams.type,
    } as Transaction;

    this.data.push(newTransaction);
    return newTransaction;
  }
}
