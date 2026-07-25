import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { KyselyModule } from '../kysely/kysely.module';

@Module({
  controllers: [WalletController],
  providers: [WalletService],
  imports: [KyselyModule],
  exports: [WalletService],
})
export class WalletModule {}
