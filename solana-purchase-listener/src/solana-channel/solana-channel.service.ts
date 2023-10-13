import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Connection, ParsedInstruction, PublicKey, } from '@solana/web3.js';
import { PURCHASE_CHANNEL_QUEUE, PurchaseChannelJobData } from './mq/purchase-channel.mq';
import { getAccount } from '@solana/spl-token';
import { SolanaTokenTransfer } from './entity/solana-token-transfer.entity';
import { TransactionContext } from 'src/common/transcation-context';

const proxy = require("node-global-proxy").default;
proxy.setConfig("http://127.0.0.1:7890");
proxy.start();
console.log("!proxy!")

@Injectable()
export class SolanaChannelService {
    private logger = new Logger(SolanaChannelService.name);
    private connection: Connection;

    constructor(
        private readonly datasource: DataSource,
        private readonly configService: ConfigService,
        @InjectQueue(PURCHASE_CHANNEL_QUEUE)
        private channelQueue: Queue<PurchaseChannelJobData>,
      ) {
      }
    
    async onModuleInit() {
      this.loopSync().catch((err) => {
        this.logger.error('Solana: failed to sync purchase', err);
      });
    }

    private async loopSync(){
      this.connection = new Connection(this.configService.get('ENDPOINT'));

      const myAddress = new PublicKey(this.configService.get('RECEIVER_TOKEN_ACCOUNT'));
      const programId = this.configService.get('PROGRAM_ID') as string;
      const programPublickey = new PublicKey(programId);
      const LOOP_INTERVAL = this.configService.get('LOOP_INTERVAL');
      this.logger.debug(`start listener: solana purchase`);
      while (true) {
        try {
          const ctx = new TransactionContext(this.datasource);
          await ctx.run(async (em, ctx) => {
            const transactions = await this.connection.getConfirmedSignaturesForAddress2(myAddress);
            for (const transfer of transactions) {
              const blockTime = transfer.blockTime;
              const slot = transfer.slot;
              const signature = transfer.signature;
              const repo = em.getRepository(SolanaTokenTransfer);
              if (await repo.exist({
                where: {blockIndex: slot, timestamp: blockTime},
              })) {
                break;
              }
              const transactionWithMeta = await this.connection.getParsedTransaction(signature, 'finalized');
               if(transactionWithMeta) {
                      const message = transactionWithMeta.transaction.message;
      
                      const sender = message.accountKeys[0].pubkey.toBase58();
      
                      const tokenReceiver = message.accountKeys[1].pubkey;
                      let receiver = '';
                      try {
                        receiver = (await getAccount(this.connection, tokenReceiver, 'confirmed', programPublickey)).owner.toBase58();
                      } catch(err) {
                        this.logger.debug(`${tokenReceiver}`)
                        receiver = 'can not';
                      }
      
                      if (receiver == this.configService.get('RECEIVER_ACCOUNT')) {
                        const parsed = (message.instructions[2] as ParsedInstruction).parsed;
                        let amount: string;
                        if (parsed.type == 'transferChecked') {
                          amount = (message.instructions[2] as ParsedInstruction).parsed.info.tokenAmount.amount;
                          await this.createTransfer({
                            tx: signature,
                            from: sender,
                            to: receiver,
                            blockIndex: transactionWithMeta.slot,
                            amount: amount,
                            timestamp: transactionWithMeta.blockTime,
                          });
                          await this.addBullJob({
                            address: sender,
                            amount: amount,
                            orderId: transactionWithMeta.slot.toString(),
                            txHash: signature,
                          });
                        } else if (parsed.type == 'transfer') {
                          amount = (message.instructions[2] as ParsedInstruction).parsed.info.amount;
                          await this.createTransfer({
                            tx: signature,
                            from: sender,
                            to: receiver,
                            blockIndex: transactionWithMeta.slot,
                            amount: amount,
                            timestamp: transactionWithMeta.blockTime,
                          });
                          await this.addBullJob({
                            address: sender,
                            amount: amount,
                            orderId: transactionWithMeta.slot.toString(),
                            txHash: signature,
                          });}}}
            }
          });
        } catch (err) {
          this.logger.error(err);
        } finally {
          await new Promise((res) => setTimeout(res, LOOP_INTERVAL * 1000));
        }
      }
    }

    async createTransfer(
      args: {
        tx: string,
        from: string,
        to: string,
        blockIndex: number,
        amount: string,
        timestamp: number,
      },
      ctx?: TransactionContext,
    ): Promise<SolanaTokenTransfer> {
      ctx = ctx || new TransactionContext(this.datasource);
      return await ctx.run(async (em, ctx) => {
        const repo = em.getRepository(SolanaTokenTransfer);
        const creatRepo = repo.create({
          tx: args.tx,
          from: args.from,
          to: args.to,
          blockIndex: args.blockIndex,
          amount: args.amount,
          timestamp: args.timestamp,
        });
        const creattransferinfo = await repo.save(creatRepo);
        return creattransferinfo;
      });
    }

    async addBullJob(
      args: {
        address: string,
        amount: string,
        orderId: string,
        txHash: string,
      },
      ctx?: TransactionContext,
    ) {
      ctx = ctx || new TransactionContext(this.datasource);
      return await ctx.run(async (em, ctx) => {
        try {
          const job = await this.channelQueue.add(
            {
              channel: 'solana',
              type: 'purchased',
              payload: {
                address: args.address,
                amount: args.amount,
                orderId: args.orderId,
                txHash: args.txHash,
              },
            },
            {
              jobId: 'solana:' + args.orderId,
              attempts: 3,
              backoff: {
                type: 'fixed',
                delay: 10 * 1000,
              },
              removeOnComplete: true,
            }
          );
          this.logger.debug(`solanaPurchased job id: ${job.id.toString()}`);
        } catch (err) {
          this.logger.error(
            `add Solana purchase job error. ${err}`
          );
        }
      });  
    }
}
