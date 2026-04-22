import { IsString } from 'class-validator';

export class IdParamDto {
  @IsString()
  readonly id!: string;
}
