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
      0,
    );
    const totalExpense = this.getByType('expense').reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      0,
    );
    return totalIncome - totalExpense;
  }

  getTransactions(id: number | undefined = undefined): Transaction[] {
    if (typeof id === 'number') {
      return this.data.filter((t) => t.id === id);
    }

    return this.data;
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
      {},
    );
  }

  getMostExpensiveTransaction(): Transaction | undefined {
    return [...this.getByType('expense')].sort(
      (a, b) => b.amount - a.amount,
    )[0];
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

export { FinancialAnalyzer };
