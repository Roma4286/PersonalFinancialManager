import { Injectable } from '@nestjs/common';
import FinancialAnalyzer from './financialAnalyzer.js';
import * as fs from 'node:fs';

@Injectable()
export class AppService {

    private analyzer: FinancialAnalyzer;
    constructor() {
        this.analyzer = new FinancialAnalyzer(
            JSON.parse(fs.readFileSync('transactions.json', { encoding: 'utf-8' }))
        );
    }
    getBalance() {
        return [this.analyzer.getTotalBalance()];
    }
}
