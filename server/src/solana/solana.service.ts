import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { decodeUTF8, decodeBase64 } from 'tweetnacl-util';

@Injectable()
export class SolanaService {
  async onModuleInit() {
    // // 3hfQ411Gmo4dfHcs6mo834xfrAJdPP13VtmXpHUpoqdrqFYZzokLK8brEMRDnrhuKg4n9fTYGG6jieGwhjW9C9ik
    // const pubkey = new PublicKey(
    //   'H44texPTEsnaBkCGzsd4rPJSv61T5xoZyq1Zt6xzkJag',
    // ).toBytes();
    // const x = new PublicKey('H44texPTEsnaBkCGzsd4rPJSv61T5xoZyq1Zt6xzkJag');
    // console.log(x);
    // console.log(`pubkey: ${pubkey}`);
    // const add = new PublicKey(pubkey).toBase58();
    // console.log(`address: ${add}`);
    // const x = 'H44texPTEsnaBkCGzsd4rPJSv61T5xoZyq1Zt6xzkJag';
    // const y = await this.getPublicKeyFromAccount(x);
    // console.log(y); // 238,132,33,226,28,88,81,254,250,18,218,25,20,18,247,67,138,85,199,9,52,28,89,137,47,106,147,67,5,104,208,109
  }

  async getPublicKeyFromAccount(address: string) {
    const pubkey = new PublicKey(address).toBytes();
    return pubkey.toString();
  }

  async verifySigner(message: string, signature: string, account: string) {
    return nacl.sign.detached.verify(
      decodeUTF8(message),
      decodeBase64(signature),
      new PublicKey(account).toBytes(),
    );
  }
}
