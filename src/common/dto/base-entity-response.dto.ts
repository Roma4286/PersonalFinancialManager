import { Expose } from 'class-transformer';

export class BaseEntityWithTimestampsResponse {
  @Expose() readonly id!: string;
  @Expose() readonly createdAt!: Date;
  @Expose() readonly updatedAt!: Date;
}
