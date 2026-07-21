import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { Kysely } from 'kysely';
import { DB } from '@/db/types';
import { KyselyService } from '../kysely/kysely.service';

@Injectable()
export class CategoryService {
  private readonly RESERVED_CATEGORY_IDS = [
    process.env.TRANSFER_EXPENSE_CATEGORY_ID,
    process.env.TRANSFER_INCOME_CATEGORY_ID,
  ];

  constructor(private kysely: KyselyService) {}

  async getAllCategories(): Promise<Category[]> {
    return await this.kysely.selectFrom('Category').selectAll().execute();
  }

  isReserved(categoryId: string): boolean {
    return this.RESERVED_CATEGORY_IDS.includes(categoryId);
  }

  async findCategoryOrThrow(
    categoryId: string,
    tx: Kysely<DB> = this.kysely,
  ): Promise<Category> {
    const category = await tx
      .selectFrom('Category')
      .selectAll()
      .where('id', '=', categoryId)
      .executeTakeFirst();

    if (!category) {
      throw new NotFoundException(
        `The category with id ${categoryId} not found`,
      );
    }

    return category;
  }
}
