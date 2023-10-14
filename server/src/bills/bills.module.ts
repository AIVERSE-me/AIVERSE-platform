import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LivemsgModule } from 'src/livemsg/livemsg.module';
import { PointsModule } from 'src/points/points.module';
import { UserModule } from 'src/user/user.module';
import { BillsService } from './bills.service';
import { Bill } from './entity/bill.entity';
import { PointsPurchaseSubscription } from './entity/points-purchase-subscription.entity';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PURCHASE_CHANNEL_QUEUE } from './mq/purchase-channel.mq';
import { SolanaPurchasaModule } from './solana-purchasa/solana-purchasa.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PointsPurchaseSubscription, Bill]),
    PointsModule,
    LivemsgModule,
    UserModule,
    BullModule.registerQueue({
      name: PURCHASE_CHANNEL_QUEUE,
    }),
    WechatPayModule,
    EthPurchaseModule,
    NeoPurchaseModule,
    NearPurchaseModule,
    SolanaPurchasaModule,
  ],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
