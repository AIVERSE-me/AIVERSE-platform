import { Module } from '@nestjs/common';
import { HandleSolanaTransferService } from './handle-solana-transfer.service';
import { TransactionModule } from '@app/transaction';
import { BullModule } from '@nestjs/bull';
import { MarketModule } from 'src/market/market.module';
import { UserModule } from 'src/user/user.module';
import { TRANSFER_CHANNEL_QUEUE } from './mq/solana-transfer.mq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TRANSFER_CHANNEL_QUEUE,
    }),
    UserModule,
    MarketModule,
    TransactionModule,
  ],
  providers: [HandleSolanaTransferService],
})
export class HandleSolanaTransferModule {}
