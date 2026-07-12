import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CategoryResponse } from './dto/category-response.dto';

@Controller('/categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: CategoryResponse,
    isArray: true,
  })
  async getAllCategories() {
    const categories = await this.categoryService.getAllCategories();
    return plainToInstance(CategoryResponse, categories, {
      excludeExtraneousValues: true,
    });
  }
}
