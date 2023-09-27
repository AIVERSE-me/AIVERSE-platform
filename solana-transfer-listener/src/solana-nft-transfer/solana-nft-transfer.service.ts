import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Queue } from 'bull';
import { TRANSFER_CHANNEL_QUEUE, TransferChannelJobData } from './mq/solana-nft-transfer.mq';
import { Connection, PublicKey } from '@solana/web3.js';
import { TransactionContext } from 'src/common/transcation-context';

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
                
            }, 'max');
        });
    }
}
