import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export class TypeTransactionResponse {
    @ApiProperty()
    @IsNumber()
    id!: number;

    @ApiProperty()
    @IsNumber()
    amount!: number;

    @ApiProperty()
    @IsDate()
    date!: Date;

    @ApiProperty()
    @IsString()
    category!: string;
    
    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type!: 'income' | 'expense';
}

export class BalanceResponseDto {
    @ApiProperty({ example: "$4,950.00" })
    totalBalance!: string;
}