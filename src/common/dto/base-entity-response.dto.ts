import { Expose } from 'class-transformer';

export class BaseEntityResponse {
  @Expose() readonly id!: string;
  @Expose() readonly createdAt!: Date;
  @Expose() readonly updatedAt!: Date;
}
