import { Injectable, Logger } from '@nestjs/common';
import { PurchaseChannel } from '../interface/purchase-channel.interface';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { PurchaseChannelId } from '../enum/PurchaseChannelId.enum';
import { PriceLevel } from '../dto/price-level.dto';
import { BigNumber } from 'ethers';
import { SolanaPurchaseChannelInfo } from './dto/solana-purchase-channel-info.dto';
import { SolanaPurchasedJobData } from './dto/solana-purchase-job-data.dto';

@Injectable()
export class SolanaPurchasaService
  implements PurchaseChannel<SolanaPurchaseChannelInfo, SolanaPurchasedJobData>
{
  private readonly logger = new Logger(SolanaPurchasaService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  id() {
    return PurchaseChannelId.SOLANA;
  }

  // 充值套餐
  async queryPointsPrice(): Promise<PriceLevel[]> {
    return [
      { price: 2.5, points: 80, tempPoints: 0 },
      { price: 5, points: 300, tempPoints: 0 },
      { price: 15, points: 1000, tempPoints: 200 },
      { price: 25, points: 2000, tempPoints: 500 },
    ];
  }

  async getChannelInfo(): Promise<SolanaPurchaseChannelInfo> {
    const receiver = this.configService.get('BILL_SOLANA_PAYMENT_ADDRESS');
    return {
      receiver,
    };
  }

  async isEnabled(): Promise<boolean> {
    return this.configService.get('BILL_SOLANA_CHANNEL_ENABLED') === 'true';
  }

  async judgeUid(data: SolanaPurchasedJobData): Promise<string> {
    const user = await this.userService.getUserViaSolanaAddress(
      data.payload.address,
    );
    if (!user) {
      throw new Error(`unknown solana address: ${data.payload.address}`);
    }
    return user.id;
  }

  async convertUnit(data: SolanaPurchasedJobData): Promise<number> {
    const {
      payload: { amount },
    } = data;
    const decimals = +this.configService.get('BILL_SOLANA_FT_DECIMALS');
    let value = 0;
    if (decimals > 8) {
      value =
        parseFloat(
          BigNumber.from(amount)
            .div(BigNumber.from('10').pow(decimals - 5))
            .toString(),
        ) / 1e5;
    } else {
      value = parseFloat(amount) / +BigNumber.from(10).pow(decimals).toString();
    }
    return value;
  }
}
