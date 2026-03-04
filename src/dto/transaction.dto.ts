import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export class TransactionDto {
    @ApiProperty()
    @IsNumber()
    readonly amount!: number;
    
    @ApiProperty()
    @IsString()
    readonly category!: string;
 
    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    readonly type!: 'income' | 'expense';
}