import { Module } from '@nestjs/common';
import { SolanaChannelService } from './solana-channel.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolanaTokenTransfer } from './entity/solana-token-transfer.entity';
import { BullModule } from '@nestjs/bull';
import { PURCHASE_CHANNEL_QUEUE } from './mq/purchase-channel.mq';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SolanaTokenTransfer]),
    BullModule.registerQueue({
      name: PURCHASE_CHANNEL_QUEUE,
    }),
  ],

  providers: [SolanaChannelService],
})
export class SolanaChannelModule {}
