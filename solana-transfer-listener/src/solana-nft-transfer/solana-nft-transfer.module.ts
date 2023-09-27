import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SolanaNftTransfer } from './entity/solana-nft-transfer.entity';
import { TRANSFER_CHANNEL_QUEUE } from './mq/solana-nft-transfer.mq';
import { SolanaNftTransferService } from './solana-nft-transfer.service';


@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
    ConfigModule,
    TypeOrmModule.forFeature([SolanaNftTransfer]),
    BullModule.registerQueue({
      name: TRANSFER_CHANNEL_QUEUE,
    }),
  ],
  providers: [SolanaNftTransferService],
  exports: [SolanaNftTransferService]
})
export class SolanaNftTransferModule {}
