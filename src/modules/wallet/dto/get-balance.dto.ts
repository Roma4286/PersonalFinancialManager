import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GetBalanceDto {
  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  readonly id!: string;
}
