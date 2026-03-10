import { Module } from '@nestjs/common';
import { StorageRepository } from './storage.repository';

@Module({
  providers: [StorageRepository],
  exports: [StorageRepository],
})
export class StorageModule {}
