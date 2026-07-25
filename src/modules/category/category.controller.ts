import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiResponse } from '@nestjs/swagger';
import { CategoryResponse } from './dto/category-response.dto';

@Controller('/categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/')
  @SerializeOptions({ type: CategoryResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: CategoryResponse,
    isArray: true,
  })
  async getAllCategories() {
    return await this.categoryService.getAllCategories();
  }
}
