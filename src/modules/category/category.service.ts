import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getAllCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany();
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
