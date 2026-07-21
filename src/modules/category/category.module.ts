import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { KyselyModule } from '../kysely/kysely.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [KyselyModule],
  exports: [CategoryService],
})
export class CategoryModule {}
