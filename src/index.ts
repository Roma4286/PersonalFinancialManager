import * as fs from "node:fs";

type TransactionTypes = "income" | "expense";

type Transaction = {
  id: number;
  amount: number;
  date: Date;
  category: string;
  type: TransactionTypes;
};

const data = JSON.parse(
  fs.readFileSync("transactions.json", { encoding: "utf-8" }),
) as Transaction[];

class FinancialAnalyzer {
  public income: Transaction[] = [];
  public expense: Transaction[] = [];

  constructor(data: Transaction[]) {
    this.income = data.filter((transaction) => transaction.type === "income");
    this.expense = data.filter((transaction) => transaction.type === "expense");
  }

  calculateTotalBalance(): number {
    let balance = 0;
    balance = this.income.reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      balance,
    );
    return this.expense.reduce(
      (accumulator, currentValue) => accumulator - currentValue.amount,
      balance,
    );
  }

  getCategoryBreakdown(operationType: TransactionTypes): object {
    let result = {};
    if (operationType === "income") {
      result = this.income.reduce<Record<string, number>>(
        (accumulator, currentValue) => {
          accumulator[currentValue.category] =
            (accumulator[currentValue.category] ?? 0) + currentValue.amount;
          return accumulator;
        },
        {},
      );
    } else {
      result = this.expense.reduce<Record<string, number>>(
        (accumulator, currentValue) => {
          accumulator[currentValue.category] =
            (accumulator[currentValue.category] ?? 0) + currentValue.amount;
          return accumulator;
        },
        {},
      );
    }
    return result;
  }

  getMostExpensiveTransaction(): Transaction | undefined{
    return this.expense.sort((a, b) => b.amount - a.amount)[0];
  }
}

const transactions = new FinancialAnalyzer(data);

console.log(transactions.calculateTotalBalance());
console.log(transactions.getCategoryBreakdown("income"));
console.log(transactions.getCategoryBreakdown("expense"));
console.log(transactions.getMostExpensiveTransaction());