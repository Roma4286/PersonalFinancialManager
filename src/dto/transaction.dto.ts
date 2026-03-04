import { IsEnum, IsNumber, IsString } from 'class-validator';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export class TransactionDto {

    @IsNumber()
    readonly amount!: number;

    @IsString()
    readonly category!: string;
 
    @IsEnum(TransactionType)
    readonly type!: 'income' | 'expense';
}