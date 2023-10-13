import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Queue } from 'bull';
import { TRANSFER_CHANNEL_QUEUE, TransferChannelJobData } from './mq/solana-nft-transfer.mq';
import { Connection, PublicKey } from '@solana/web3.js';
import { TransactionContext } from 'src/common/transcation-context';
import { SolanaNftTransfer } from './entity/solana-nft-transfer.entity';
import { Metadata, Metaplex } from "@metaplex-foundation/js";
import { getAccount } from '@solana/spl-token';

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
      // const mintAddress = new PublicKey("C1m5PadAuY5tujZqCWkk3Em3fNnPfQJWis3DcK6exLn7");
      // const network = 'https://api.devnet.solana.com';
      // this.connection = new Connection(network);
      // // const metaplex = new Metaplex(this.connection);
      // // const nft = await metaplex.nfts().findByMint({ mintAddress });
      // // console.log(JSON.stringify(nft));
      // // console.log(await this.connection.getTokenSupply(mintAddress));
      // const programId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
      // const newTokenOwner = (await this.connection.getTokenLargestAccounts(mintAddress)).value[0].address;
      // const newOwner = (await getAccount(this.connection, newTokenOwner, 'confirmed', programId)).owner.toBase58();
      // console.log(newOwner);
      this.listenNftTransfer().catch((err) => {
        this.logger.error('Solana: failed to sync transfer', err);
      });
    }

    private async listenNftTransfer() {
      this.logger.debug(`start listener: solana nft transfer`);
      const LOOP_INTERVAL = +this.configService.get('LOOP_INTERVAL');
      const network = this.configService.get('ENDPOINT');
      this.connection = new Connection(network);
      const programId = new PublicKey(this.configService.get('NFT_PROGRAM_ID') as string);
      const programToken = new PublicKey(this.configService.get('TOKEN_PROGRAM') as string);

      const metaplex = new Metaplex(this.connection);
      // console.log(programId);
      while (true){
        try {
          const ctx = new TransactionContext(this.datasource);
          await ctx.run(async (em, ctx) => {
            const nfts = await metaplex.nfts().findAllByCreator({
              creator: programId,
              position: 1,
            });
            // console.log(JSON.stringify(nfts));
            const repo = em.getRepository(SolanaNftTransfer);
            const localNftsNum = await repo.count();
            this.logger.debug(`Total: ${nfts.length} nfts; Local: ${localNftsNum}`);
            for (let nft of nfts) {
              nft = nft as Metadata;
              const uri = nft.uri;
              const name = nft.name;
              const type = name.split('#')[0];
              const offLineId = (uri.split('/').pop()).split('.')[0];
              let oldOwner = '';
              let newOwner = '';
              if (await repo.exist({
                where: {nftTokenId: name},
              })) {
                const transferInfo = await repo.findOne({
                  where: {
                    nftTokenId: name,
                  }
                });
                const newTokenOwner = (await this.connection.getTokenLargestAccounts(nft.mintAddress)).value[0].address;
                newOwner = (await getAccount(this.connection, newTokenOwner, 'confirmed', programToken)).owner.toBase58();
                if (newOwner != transferInfo.newOwner) {
                  oldOwner = transferInfo.newOwner;
                  await this.addBullJob(oldOwner, newOwner, name, '', type, offLineId);
                  await this.updateTransfer(name, nft.creators.length, newOwner);
                }
              } else {
                newOwner = nft.creators[nft.creators.length - 1].address.toBase58();
                await this.creatTransfer(
                  0,
                  'blockHash',
                  'txHash',
                  'time',
                  newOwner,
                  'SYSTEM',
                  name,
                  nft.creators.length,
                  uri,
                  nft.address.toBase58(),
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
        uri: string,
        address: string,
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
            uri: uri,
            address: address,
          });
          const creattransferinfo = await repo.save(creatRepo);
          return creattransferinfo;
        });
      }

    async updateTransfer(
      name: string,
      creatorNum: number,
      newOwner: string,
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
        transferInfo.oldOwner = transferInfo.newOwner;
        transferInfo.newOwner = newOwner;
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
