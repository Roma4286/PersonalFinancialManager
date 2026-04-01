import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { TransactionType } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  async getAllTransactions() {
    return await this.transactionRepository.getAllTransactions();
  }

  async getTransactionById(transactionId: number) {
    const transaction =
      await this.transactionRepository.getTransactionById(transactionId);

    if (transaction === null) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`,
      );
    }

    return transaction;
  }

  async getBalance(walletId: number) {
    const wallet = await this.transactionRepository.getWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${walletId} not found`);
    }

    return wallet.balance;
  }

  async createNewTransaction(dto: CreateTransactionDto) {
    const wallet = await this.transactionRepository.getWalletById(dto.walletId);
    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${dto.walletId} not found`);
    }

    const category = await this.transactionRepository.getCategoryById(
      dto.categoryId,
    );

    if (!category) {
      throw new NotFoundException(
        `Category with id ${dto.categoryId} not found`,
      );
    }
    const balanceDelta =
      (category.type as TransactionType) === TransactionType.EXPENSE
        ? -dto.amount
        : dto.amount;

    if (wallet.balance + balanceDelta < 0) {
      throw new BadRequestException('Insufficient funds');
    }

    return await this.transactionRepository.createNewTransaction(dto);
  }

  async deleteTransaction(transactionId: number) {
    const transaction = await this.getTransactionById(transactionId);

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`,
      );
    }

    return await this.transactionRepository.deleteTransactionById(transaction);
  }
}
