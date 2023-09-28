import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Queue } from 'bull';
import { TRANSFER_CHANNEL_QUEUE, TransferChannelJobData } from './mq/solana-nft-transfer.mq';
import { Connection, PublicKey } from '@solana/web3.js';
import { TransactionContext } from 'src/common/transcation-context';
import { SolanaNftTransfer } from './entity/solana-nft-transfer.entity';

const proxy = require("node-global-proxy").default;
proxy.setConfig("http://127.0.0.1:7890");
proxy.start();
console.log("!proxy!")

@Injectable()
export class SolanaNftTransferService {
    private logger = new Logger(SolanaNftTransferService.name);
    private connection: Connection;

    constructor(
        private readonly datasource: DataSource,
        // private readonly http: HttpService,
        private readonly configService: ConfigService,
        @InjectQueue(TRANSFER_CHANNEL_QUEUE)
        private channelQueue: Queue<TransferChannelJobData>,
      ) {}
    
    async onModuleInit() {
    }

    private async listenNftTransfer() {
        const network = 'https://api.devnet.solana.com';
        this.connection = new Connection(network);

        const programId = new PublicKey(this.configService.get('NFT_PROGRAM_ID') as string);
        const programAddress = new PublicKey(this.configService.get('NFT_PROGRAM_ADDRESS') as string);
        const ctx = new TransactionContext(this.datasource);
        await ctx.run(async (em, ctx) => {
            this.connection.onLogs(programAddress, async (logs) => {
                // 从logs中分析：1. 铸造还是转移 2. 发送者/接收者 3.记录数据/发送消息队列
            }, 'max');
        });
    }

    async creatTransfer(
        index: number,
        blockHash: string,
        txHash: string,
        time: string,
        newOwner: string,
        oldOwner: string,
        nftTokenId: string,
        ctx?: TransactionContext,
      ): Promise<SolanaNftTransfer> {
        ctx = ctx || new TransactionContext(this.datasource);
        return await ctx.run(async (em, ctx) => {
          const repo = em.getRepository(SolanaNftTransfer);
          const creatRepo = repo.create({
            index: index,
            blockHash: blockHash,
            txHash: txHash,
            time: time,
            newOwner: newOwner,
            oldOwner: oldOwner,
            nftTokenId: nftTokenId,
          });
          const creattransferinfo = await repo.save(creatRepo);
          return creattransferinfo;
        });
      }

      private async addBullJob(
        from: string,
        to: string,
        tokenId: string,
        txHash: string,
        type: string,
        offLineId: string,
      ) {
        try {
          const job = await this.channelQueue.add(
            {
              channel: 'solana',
              type: 'transfer',
              transferload: {
                from: from,
                to: to,
                tokenId: tokenId,
                txHash: txHash,
                type: type,
                offlineId: offLineId,
              },
            },
            {
              attempts: 3,
              backoff: {
                type: 'fixed',
                delay: 10 * 1000,
              },
              removeOnComplete: true,
            },
          );
          this.logger.debug(`Solana transfer job id: ${job.id.toString()}`);
        } catch (err) {
          this.logger.error(
            `add Solana transfer job error: ${err}`,
          );
        }
      }
    
    
}
