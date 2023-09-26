import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AccountInfo, Connection, PublicKey, TransactionInstruction, clusterApiUrl, TokenAccountsFilter } from '@solana/web3.js';
import { PURCHASE_CHANNEL_QUEUE, PurchaseChannelJobData } from './mq/purchase-channel.mq';

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
      
      // this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      this.loopSync();
    }

    private async loopSync(){
      // 创建连接
      const network = 'https://api.devnet.solana.com';
      this.connection = new Connection(network);

      const tokenAddres = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
      const myAddress = new PublicKey('AU8JGWcu3KMYsxosyLLA2rcnqzZXPToM7T1rUoCYMRDB');
      // this.connection.onProgramAccountChange(myAddress, (accountInfo) => {
      //   console.log('Transfer', accountInfo) ;
      // });
      // // 余额查询
      const x = await this.connection.getParsedAccountInfo(tokenAddres);
      console.log(x.value.owner);
      this.connection.onProgramAccountChange(x.value.owner, (accountInfo) => {
        console.log('Transfer', accountInfo) ;
      },'singleGossip');
      // const tokenMyAddress = await this.connection.getParsedTokenAccountsByOwner(myAddress,{
      //   programId: x.value.owner
      // });
      // console.log(tokenMyAddress.context );

    //   const latestSlot = await this.connection.getSlot();
    //   console.log(`Last Slot: ${latestSlot}`);
    //   const blockTransactions = (await this.connection.getBlock(246726160)).transactions;
    //   console.log(blockTransactions);
    //   const transferProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    //   for (let transaction of blockTransactions) {
    //     const { message } = transaction.transaction;
    //     const instructions = message.instructions;
    //     // const txInstruction = new TransactionInstruction(instructions);
    //     console.log(message);
    //     // for (let instruction of instructions) {
    //     //   console.log(instruction);
    //     // }
    //   }

    }
}
