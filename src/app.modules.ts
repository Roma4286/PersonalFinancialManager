import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { StorageModule } from './modules/storage/storage.module.ts';
import { FinancialAnalyzerModule } from './modules/financial-analyzer/financial-analyzer.module.ts';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [StorageModule, FinancialAnalyzerModule],
})
export class AppModules {}
