import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class FindTransactionDto {
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @Min(1, { message: 'id must be greater than or equal to 0' })
    readonly id!: number;
}