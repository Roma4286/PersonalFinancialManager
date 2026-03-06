import { Injectable } from '@nestjs/common';
import type { Transaction } from '../storage/storage.service.ts';

@Injectable()
export class FinancialAnalyzerService {
  calculateTotalBalance(income: Transaction[], expense: Transaction[]): number {
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

  getCategoryBreakdown(expense: Transaction[]): Record<string, number> {
    return expense.reduce<Record<string, number>>(
      (accumulator, currentValue) => {
        accumulator[currentValue.category] =
          (accumulator[currentValue.category] ?? 0) + currentValue.amount;
        return accumulator;
      },
      {},
    );
  }

  getMostExpensiveTransaction(expense: Transaction[]): Transaction | undefined {
    return [...expense].sort((a, b) => b.amount - a.amount)[0];
  }
}
