import { Module } from '@nestjs/common';
import { SolanaPublishService } from './solana-publish.service';
import { MarketModule } from 'src/market/market.module';
import { AssetsModule } from 'src/assets/assets.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MarketModule, AssetsModule, ConfigModule],
  providers: [SolanaPublishService],
  exports: [SolanaPublishService],
})
export class SolanaPublishModule {}
