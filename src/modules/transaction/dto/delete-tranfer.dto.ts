import { IsNotEmpty, IsString, Length } from 'class-validator';

export class DeleteTransferDto {
  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  readonly transferGroupId!: string;
}
