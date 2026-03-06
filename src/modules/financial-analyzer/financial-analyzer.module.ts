import { Module } from '@nestjs/common';
import { FinancialAnalyzerService } from './financial-analyzer.service.ts';

@Module({
  providers: [FinancialAnalyzerService],
  exports: [FinancialAnalyzerService],
})
export class FinancialAnalyzerModule {}
