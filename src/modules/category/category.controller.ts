import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiResponse } from '@nestjs/swagger';
import { Category } from './dto/response-category.dto';

@Controller('/category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/categories')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: Category,
    isArray: true,
  })
  async getAllCategories() {
    return await this.categoryService.getAllCategories();
  }
}
