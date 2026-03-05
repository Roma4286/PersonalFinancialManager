import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export class TransactionDto {
    @ApiProperty()
    @IsNumber()
    @Min(0, {message: "Amount must be > 0"})
    readonly amount!: number;
    
    @ApiProperty()
    @IsString()
    readonly category!: string;
 
    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    readonly type!: 'income' | 'expense';
}
 