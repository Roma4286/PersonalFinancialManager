import * as fs from 'node:fs';

type TransactionType = 'income' | 'expense';

type Transaction = {
  id: number;
  amount: number;
  date: Date;
  category: string;
  type: TransactionType;
};

class FinancialAnalyzer {
  public data: Transaction[] = [];

  constructor(data: unknown) {
    this.data = this.parse(data);
  }

  isTransaction(value: unknown): value is Transaction {
    if (typeof value !== 'object' || value === null) return false;

    const obj = value as Record<string, unknown>;

    let date: Date = new Date();
    if (typeof obj.date === 'string') {
      date = new Date(obj.date);
    }

    return (
      typeof obj.id === 'number' &&
      typeof obj.amount === 'number' &&
      !Number.isNaN(date.valueOf()) &&
      typeof obj.category === 'string' &&
      (obj.type === 'income' || obj.type === 'expense')
    );
  }

  parse(data: unknown): Transaction[] {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array');
    }

    if (!data.every((item) => this.isTransaction(item))) {
      throw new Error('Data is not valid');
    }

    return data.map((item) => ({
      ...item,
      date: new Date(item.date),
    }));
  }

  private formatAmount(amount: number) {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private getByType(type: TransactionType): Transaction[] {
    return this.data.filter((transaction) => transaction.type === type);
  }

  private calculateTotalBalance(): number {
    const totalIncome = this.getByType('income').reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      0
    );
    const totalExpense = this.getByType('expense').reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      0
    );
    return totalIncome - totalExpense;
  }

  getTotalBalance(): string {
    return this.formatAmount(this.calculateTotalBalance());
  }

  getCategoryBreakdown(): Record<string, number> {
    return this.getByType('expense').reduce<Record<string, number>>(
      (accumulator, currentValue) => {
        accumulator[currentValue.category] =
          (accumulator[currentValue.category] ?? 0) + currentValue.amount;
        return accumulator;
      },
      {}
    );
  }

  getMostExpensiveTransaction(): Transaction | undefined {
    return [...this.getByType('expense')].sort(
      (a, b) => b.amount - a.amount
    )[0];
  }
}

function main(fileName: string) {
  const analyzer = new FinancialAnalyzer(
    JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' }))
  );

  console.log(analyzer.getTotalBalance());
  console.log(analyzer.getCategoryBreakdown());
  console.log(analyzer.getMostExpensiveTransaction());
}

main('transactions.json');
