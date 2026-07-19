import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  private readonly RESERVED_CATEGORY_IDS = [
    process.env.TRANSFER_EXPENSE_CATEGORY_ID,
    process.env.TRANSFER_INCOME_CATEGORY_ID,
  ];

  constructor(private prisma: PrismaService) {}

  async getAllCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany();
  }

  isReserved(categoryId: string): boolean {
    return this.RESERVED_CATEGORY_IDS.includes(categoryId);
  }

  async findCategoryOrThrow(
    categoryId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Category> {
    const category = await tx.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `The category with id ${categoryId} not found`,
      );
    }

    return category;
  }
}
