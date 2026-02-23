import * as fs from "node:fs";

type TransactionTypes = "income" | "expense";

type Transaction = {
  id: number;
  amount: number;
  date: Date;
  category: string;
  type: TransactionTypes;
};

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "number" &&
    typeof obj.amount === "number" &&
    typeof obj.date === "string" &&
    typeof obj.category === "string" &&
    (obj.type === "income" || obj.type === "expense")
  );
}

function parse(data: unknown): Transaction[] | Error {
  if (typeof data !== "string" && !Array.isArray(data)) {
    throw new Error("Input data must be string or array");
  }

  let cleardata: Transaction[];
  try {
    if (typeof data === "string") {
      cleardata = JSON.parse(data) as Transaction[];
    } else {
      cleardata = data;
    }

    if (!cleardata.every(isTransaction)) {
      return new Error("Data is not valid");
    }
    return cleardata;
  } catch (e) {
    return new Error(String(e));
  }
}

const data = parse(fs.readFileSync("transactions.json", { encoding: "utf-8" }));

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

  getMostExpensiveTransaction(): Transaction | undefined {
    return this.expense.sort((a, b) => b.amount - a.amount)[0];
  }
}
// console.log(data);
if (data instanceof Error) {
  console.error("Failed:", data.message);
} else {
  const transactions = new FinancialAnalyzer(data);

  console.log(transactions.calculateTotalBalance());
  console.log(transactions.getCategoryBreakdown("income"));
  console.log(transactions.getCategoryBreakdown("expense"));
  console.log(transactions.getMostExpensiveTransaction());
}
