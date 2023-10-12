import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Queue } from 'bull';
import { TRANSFER_CHANNEL_QUEUE, TransferChannelJobData } from './mq/solana-nft-transfer.mq';
import { Connection, PublicKey } from '@solana/web3.js';
import { TransactionContext } from 'src/common/transcation-context';
import { SolanaNftTransfer } from './entity/solana-nft-transfer.entity';
import { Metaplex } from "@metaplex-foundation/js";

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
      // console.log(Buffer.from('23d19c30-6f4c-4595-8b3b-8cd078303f8c').toString('base64'));
      await this.listenNftTransfer();
    }

    private async listenNftTransfer() {
      const LOOP_INTERVAL = 20;
      const network = 'https://api.devnet.solana.com';
      this.connection = new Connection(network);

      const programId = new PublicKey(this.configService.get('NFT_PROGRAM_ID') as string);
      const programAddress = new PublicKey(this.configService.get('NFT_PROGRAM_ADDRESS') as string);
      const ctx = new TransactionContext(this.datasource);

      const metaplex = new Metaplex(this.connection);
      console.log(`开始获取全部nfts`);
      console.log(programId);
      while (true){
        try {
          const ctx = new TransactionContext(this.datasource);
          await ctx.run(async (em, ctx) => {
            const nfts = await metaplex.nfts().findAllByCreator({
              creator: programId,
              position: 1,
            });
            console.log(`获取成功`);
            console.log(`${JSON.stringify(nfts)}`);
            for (const nft of nfts) {
              const uri = nft.uri;
              const name = nft.name;
              const type = name.split('#')[0];
              const offLineId = (uri.split('/').pop()).split('.')[0];
              let oldOwner = '';
              const newOwner = nft.creators[nft.creators.length - 1].address.toBase58();
              // 判断是否存在
              const repo = em.getRepository(SolanaNftTransfer);
              if (await repo.exist({
                where: {nftTokenId: name},
              })) {
                const transferInfo = await repo.findOne({
                  where: {
                    nftTokenId: name,
                  }
                });
                // 判断是否有更新
                if (transferInfo.creatorNum != nft.creators.length) {
                  oldOwner = transferInfo.newOwner;
                  await this.addBullJob(oldOwner, newOwner, name, '', type, offLineId);
                  // todo 更新数据库数据
                  await this.updateTransfer(name, nft.creators.length);
                }
              } else {
                // 创建数据库
                // 发起
                await this.creatTransfer(
                  0,
                  'blockHash',
                  'txHash',
                  'time',
                  newOwner,
                  'SYSTEM',
                  name,
                  nft.creators.length,
                );
                await this.addBullJob('SYSTEM', newOwner, name, '', type, offLineId)
              }
            }
          });
        } catch (err) {
          this.logger.error(err);
        } finally {
          await new Promise((res) => setTimeout(res, LOOP_INTERVAL * 1000));
        }
      }
    }

    async creatTransfer(
        index: number,
        blockHash: string,
        txHash: string,
        time: string,
        newOwner: string,
        oldOwner: string,
        nftTokenId: string,
        creatorNum: number,
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
            creatorNum: creatorNum,
          });
          const creattransferinfo = await repo.save(creatRepo);
          return creattransferinfo;
        });
      }

    async updateTransfer(
      name: string,
      creatorNum: number,
      ctx?: TransactionContext,
    ): Promise<SolanaNftTransfer>{
      ctx = ctx || new TransactionContext(this.datasource);
      return await ctx.run(async (em, ctx) => {
        const repo = em.getRepository(SolanaNftTransfer);
        const transferInfo = await repo.findOne({
          where: {
            nftTokenId: name,
          }
        });
        transferInfo.creatorNum = creatorNum;
        const updateTransferInfo = await repo.save(transferInfo);
        return updateTransferInfo;
      })
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
