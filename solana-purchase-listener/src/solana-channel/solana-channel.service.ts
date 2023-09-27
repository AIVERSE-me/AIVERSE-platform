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
    private lastSignature: string;

    constructor(
        private readonly datasource: DataSource,
        private readonly configService: ConfigService,
        @InjectQueue(PURCHASE_CHANNEL_QUEUE)
        private channelQueue: Queue<PurchaseChannelJobData>,
      ) {
      }
    
    async onModuleInit() {
      this.lastSignature = '';
      this.loopSync();
    }

    private async loopSync(){

      const network = 'https://api.devnet.solana.com';
      this.connection = new Connection(network);

      const tokenAddres = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
      const myAddress = new PublicKey('AU8JGWcu3KMYsxosyLLA2rcnqzZXPToM7T1rUoCYMRDB');
      const programId = this.configService.get('PROGRAM_ID') as string;
      const programPublickey = new PublicKey(programId);

      const ctx = new TransactionContext(this.datasource);
      await ctx.run(async (em, ctx) => {
        this.connection.onLogs(tokenAddres,async (transferLogs) => {
          // console.log(transferLogs);
          const log = transferLogs.logs;
          if (programId.indexOf(log[0]) && 'TransferChecked'.indexOf(log[1])) {
            const signature = transferLogs.signature;

            console.log(this.lastSignature);
            console.log(signature);

            if (this.lastSignature != signature) {

              const transactionWithMeta = await this.connection.getParsedTransaction(signature, 'finalized');
              if(transactionWithMeta) {
                this.lastSignature = signature;
                // console.log(transactionWithMeta);

                const message = transactionWithMeta.transaction.message;

                const sender = message.accountKeys[0].pubkey.toBase58();

                const tokenReceiver = message.accountKeys[1].pubkey;

                const receiver = (await getAccount(this.connection, tokenReceiver, 'confirmed', programPublickey)).owner.toBase58()

                if (receiver == this.configService.get('RECEIVER_ACCOUNT')) {
                  const amount = (message.instructions[0] as ParsedInstruction).parsed.info.tokenAmount.amount

                  await this.createTransfer({
                    tx: signature,
                    from: sender,
                    to: receiver,
                    blockIndex: transactionWithMeta.slot,
                    amount: amount,
                    timestamp: transactionWithMeta.blockTime.toString(),
                  });
                  await this.addBullJob({
                    address: sender,
                    amount: amount,
                    orderId: transactionWithMeta.slot.toString(),
                    txHash: signature,
                  });
                }
              }
            }
            
          }
  
        }, 'max');
      });
    }

    async createTransfer(
      args: {
        tx: string,
        from: string,
        to: string,
        blockIndex: number,
        amount: string,
        timestamp: string,
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
