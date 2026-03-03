export class TransactionDto{
    readonly amount!: number;
    readonly category!: string;
    readonly type!: 'income' | 'expense';
}