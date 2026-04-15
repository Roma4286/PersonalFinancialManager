import { IsString } from 'class-validator';

export class RemoveTransactionDto {
  @IsString()
  readonly id!: string;
}
