import { IsString } from 'class-validator';

export class GetTransactionDto {
  @IsString()
  readonly id!: string;
}
