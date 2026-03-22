import { Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionRepository {
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
  private lastId = this.data.at(-1)?.id ?? 0;

  getTransactions(): Transaction[] {
    return structuredClone(this.data);
  }

  getTransactionById(id: number): Transaction | null {
    return structuredClone(this.data.find((t) => t.id === id)) ?? null;
  }

  getTransactionsByType(type: TransactionType): Transaction[] {
    return structuredClone(
      this.data.filter((transaction) => transaction.type === type),
    );
  }

  deleteTransaction(id: number): boolean {
    const index = this.data.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }

    this.data.splice(index, 1);
    return true;
  }

  createNewTransaction(newTransactionParams: CreateTransactionDto) {
    const newTransaction: Transaction = {
      id: ++this.lastId,
      amount: newTransactionParams.amount,
      date: new Date(),
      category: newTransactionParams.category,
      type: newTransactionParams.type,
    };

    this.data.push(newTransaction);
    return structuredClone(newTransaction);
  }
}
