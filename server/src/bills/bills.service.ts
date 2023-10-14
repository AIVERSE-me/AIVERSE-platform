import { Injectable, Logger } from '@nestjs/common';
import { TransactionContext } from 'src/common/transcation-context';
import { Bill } from './entity/bill.entity';
import { IBillsService } from './interface/bills-service.interface';
import { DataSource, In, Repository } from 'typeorm';
import {
  ChannelPurchasedJobData,
  PURCHASE_CHANNEL_QUEUE,
} from './mq/purchase-channel.mq';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PointsService } from 'src/points/points.service';
import { LivemsgService } from 'src/livemsg/livemsg.service';
import {
  buildLiveMsgPointsChangedPayload,
  LiveMsgPointsChangedReason,
} from 'src/const/livemsgs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PointsPurchasedEventData,
  POINTS_PURCHASED_EVENT,
} from './event/points-purchansed.event';
import { PriceLevel } from './dto/price-level.dto';
import { NeoPurchaseService } from './neo-purchase/neo-purchase.service';
import { EthPurchaseService } from './eth-purchase/eth-purchase.service';
import { PurchaseChannel } from './interface/purchase-channel.interface';
import { PurchaseChannelId } from './enum/PurchaseChannelId.enum';
import { WechatPayService } from './wechat-pay/wechat-pay.service';
import { NearPurchaseService } from './near-purchase/near-purchase.service';
import { InjectRepository } from '@nestjs/typeorm';
import { SolanaPurchasaService } from './solana-purchasa/solana-purchasa.service';

@Processor(PURCHASE_CHANNEL_QUEUE)
@Injectable()
export class BillsService implements IBillsService {
  private logger = new Logger(BillsService.name);
  private readonly purchaseChannels: Record<
    PurchaseChannelId,
    PurchaseChannel<any, ChannelPurchasedJobData>
  >;
  constructor(
    private readonly datasource: DataSource,
    private readonly pointsSerivce: PointsService,
    private readonly livemsgService: LivemsgService,
    private readonly eventEmitter: EventEmitter2,
    wechatPayService: WechatPayService,
    solanaPurchaseService: SolanaPurchasaService,
    @InjectRepository(Bill) private readonly billRepo: Repository<Bill>,
  ) {
    this.purchaseChannels = {
      wechat: wechatPayService,
      solana: solanaPurchaseService,
    };
  }

  async queryBills(
    args: {
      uid: string;
      channels?: PurchaseChannelId[];
    },
    ctx?: TransactionContext,
  ): Promise<Bill[]> {
    ctx = ctx || new TransactionContext(this.datasource);
    return await ctx.run(async (em) => {
      const repo = em.getRepository(Bill);
      return await repo.find({
        where: {
          uid: args.uid,
          channel: args.channels ? In(args.channels) : undefined,
        },
      });
    });
  }

  async countTotalBoughtPoints(
    args: {
      uid: string;
      channels?: PurchaseChannelId[];
    },
    ctx?: TransactionContext,
  ): Promise<number> {
    let sumPoints = 0;
    const repo = ctx?.getRepository(Bill) || this.billRepo;
    const billsInDb = await repo.find({
      where: {
        uid: args.uid,
        channel: args.channels ? In(args.channels) : undefined,
      },
    });
    for (let i = 0; i < billsInDb.length; i++) {
      sumPoints = sumPoints + billsInDb[i].points;
    }
    return sumPoints;
  }

  // 返回按价格从低到高的套餐
  async queryPointsPrices(channel: PurchaseChannelId): Promise<PriceLevel[]> {
    const prices = await this.getChannel(channel).queryPointsPrice();
    return prices.sort((a, b) => a.price - b.price); // 从小到大
  }

  async canUseChannel(channel: PurchaseChannelId): Promise<boolean> {
    return await this.getChannel(channel).isEnabled();
  }

  async getChannelInfo(channel: PurchaseChannelId) {
    return await this.getChannel(channel).getChannelInfo();
  }

  //订阅消息队列事件
  @Process()
  async handlePurchasedJob(job: Job<ChannelPurchasedJobData>) {
    const ctx = new TransactionContext(this.datasource);
    try {
      return await ctx.run(async (em, ctx) => {
        const repo = em.getRepository(Bill);
        const { data } = job;

        // 排除已经处理过的channel+orderId。避免应MQ问题造成业务异常。
        if (
          await repo.exist({
            where: {
              channel: data.channel,
              orderId: data.payload.orderId,
            },
          })
        ) {
          return;
        }

        // 找到充值对应的用户
        const channel = this.getChannel(
          this.convertJobDataChannelType(data.channel),
        );
        const uid = await channel.judgeUid(data);

        // 通过amount获取对应充值套餐
        const price = this.judgePriceLevel(
          await channel.queryPointsPrice(),
          await channel.convertUnit(data),
        );
        if (!price) {
          this.logger.warn(`not enought value: ${JSON.stringify(job.data)}`);
          return;
        }

        const description = `${data.channel} paid ${data.payload.amount} meet "${price.price} value = ${price.points} + ${price.tempPoints}" level`;
        this.logger.log(description);
        const points = price.points + price.tempPoints;

        // 发放积分
        await this.pointsSerivce.changeUserPoints(
          {
            uid,
            operator: BillsService.name,
            points: points,
            desc: description,
          },
          { entityManager: em },
        );

        // 记录Bill
        let obj = repo.create({
          uid,
          channel: data.channel,
          orderId: data.payload.orderId,
          points,
          reason: description,
          payload: data.payload,
        });
        obj = await repo.save(obj);

        // 注册提交后的回调: 发送实时消息
        ctx.runAfterCommit(
          async () =>
            await this.livemsgService.send(
              buildLiveMsgPointsChangedPayload({
                rid: obj.uid,
                points: obj.points,
                reason: LiveMsgPointsChangedReason.PURCHASED,
              }),
            ),
        );
        // 发出积分购买事件
        const eventData: PointsPurchasedEventData = {
          bill: obj,
          ctx,
        };
        await this.eventEmitter.emitAsync(POINTS_PURCHASED_EVENT, eventData);
      });
    } catch (err) {
      // 钱包未绑定的异常用warning级别，不属于服务端异常
      if (err?.message && err.message.startsWith('unknown ')) {
        this.logger.warn(`${err?.message}`);
      } else {
        this.logger.error(`handle ${job.data.channel} failed: ${err?.message}`);
      }
      throw err;
    }
  }

  // 判断某价格对应的充值套餐
  judgePriceLevel(priceLevels: PriceLevel[], convertedAmount: number) {
    const highToLowLevels = [...priceLevels].sort((a, b) => b.price - a.price);
    for (const price of highToLowLevels) {
      if (convertedAmount >= price.price) {
        return price;
      }
    }
    return null;
  }

  private getChannel(channel: PurchaseChannelId) {
    const svc = this.purchaseChannels[channel];
    if (svc === undefined) {
      this.logger.error(`invalid channel: ${channel}`);
      throw new Error(`invalid channel: ${channel}`);
    }
    return svc;
  }

  private convertJobDataChannelType(
    channel: ChannelPurchasedJobData['channel'],
  ) {
    const map: Record<ChannelPurchasedJobData['channel'], PurchaseChannelId> = {
      wechat: PurchaseChannelId.WECHAT,
      solana: PurchaseChannelId.SOLANA,
    };
    return map[channel];
  }
}
