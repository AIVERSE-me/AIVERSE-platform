import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MarketPersonTemplateService } from 'src/market/service/market-person-template.service';
import { MarketPrivateModelService } from 'src/market/service/market-private-model.service';
import { AssetsService } from 'src/assets/assets.service';
import { fork } from 'child_process';
import { TransactionContext } from 'src/common/transcation-context';
import { PrivateModelEntity } from 'src/market/entity/private-model.entity';
import { PersonTemplateEntity } from 'src/market/entity/person-template.entity';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { dirname, join, parse, relative } from 'path';
import { mkdir } from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { sha512 } from '@noble/hashes/sha512';
import * as ed from '@noble/ed25519';

export interface SingerPublishInfo {
  message: string;
  signature: string;
}

export interface PublishInfo {
  name: string;
  type: string;
  image: string;
  offLineId: string;
  info: string;
}

export interface MessageInfo {
  name: string;
  type: string;
  image: string;
  fileMD5: any;
  offLineId: string;
  info: string;
}

@Injectable()
export class SolanaPublishService {
  private logger = new Logger(SolanaPublishService.name);

  constructor(
    private readonly datasource: DataSource,
    private readonly marketPrivateModelService: MarketPrivateModelService,
    private readonly marketPersonTemplateService: MarketPersonTemplateService,
    private readonly assetService: AssetsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // const x =
    //   '51xn6EE6wmbrBTMnK5QxVwhqkymgjMr8cNFJso2nCxYLhL3a1S7xGnsjxt4UBL7HA1SGVY1P6HMscxikWNmiwkpZ';
    // const y = Keypair.generate();
    // console.log(y.publicKey, y.secretKey);
    // 23d19c30-6f4c-4595-8b3b-8cd078303f8c
    // console.log(
    //   await this.prePublishNft('23d19c30-6f4c-4595-8b3b-8cd078303f8c', 'model'),
    // );
    await mkdir('static/solana-token', { recursive: true });
  }

  async Url2MD5(url: string) {
    return new Promise((resolve, reject) => {
      const childProcess = fork('./src/solana-publish/url2MD5.js');

      childProcess.on('message', (msg) => {
        resolve(msg.toString());
      });

      childProcess.on('error', (err) => {
        this.logger.error('Url2MD5 child process error occurred: ', err);
        reject(err);
      });
      childProcess.send(url);
    });
  }

  async saveJson(args: {
    name: string;
    type: string;
    image: string;
    offLineId: string;
    info: any;
  }) {
    console.log(1);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    const data = {
      name: args.name,
      symbol: 'AITEST',
      description: '',
      image: args.image,
      type: args.type,
      offLineId: args.offLineId,
      info: args.info,
    };
    const jsonData = JSON.stringify(data);
    console.log(2);
    const filepath = join('static', `solana-token/${args.offLineId}.json`);
    fs.writeFile(filepath, jsonData, (err) => {
      if (err) throw err;
      console.log('JSON data saved to file');
    });
    console.log(3);
    return filepath;
  }

  async prePublishNft(
    offLineId: string,
    publishType: string,
    ctx?: TransactionContext,
  ) {
    ctx = ctx || new TransactionContext(this.datasource);
    return await ctx.run(async (em) => {
      // 通过资源ID获取需要的信息
      let presetModelInfo = new PrivateModelEntity();
      let presetTempleInfo = new PersonTemplateEntity();
      let publishInfo: PublishInfo = {
        name: '',
        type: '',
        image: '',
        offLineId: '',
        info: '',
      };

      if (publishType == 'model') {
        presetModelInfo = await this.marketPrivateModelService.get(offLineId);
        // 获取模型文件Url
        const modelUrl = (
          await this.assetService.getAssetUrl(presetModelInfo.model.embedding)
        ).replace(/\\\\/g, '/');
        const imageUrl = (
          await this.assetService.getAssetUrl(
            presetModelInfo.model.inputImages[0],
          )
        ).replace(/\\\\/g, '/');
        const modelInfo = {
          modelFile: modelUrl.replace(/\\/g, '/'),
          modelType: presetModelInfo.model.type,
        };
        publishInfo = {
          name: presetModelInfo.model.token,
          type: 'model',
          image: imageUrl.replace(/\\/g, '/'),
          offLineId: offLineId,
          info: JSON.stringify(modelInfo),
        };
      } else {
        presetTempleInfo = await this.marketPersonTemplateService.get(
          offLineId,
        );
        publishInfo = {
          name: presetTempleInfo.preset.name,
          type: 'temple',
          image: presetTempleInfo.preset.displayImgUrl,
          offLineId: offLineId,
          info: JSON.stringify(presetTempleInfo.preset.attributes),
        };
      }
      let fileURL = publishInfo.image;
      if (publishInfo.type == 'model') {
        console.log(JSON.parse(publishInfo.info));
        fileURL = JSON.parse(publishInfo.info).modelFile;
      }
      const md5 = await this.Url2MD5(fileURL);

      this.logger.log(`Publish Type: ${publishInfo.type}; File MD5: ${md5}`);
      const num = Math.floor(Math.random() * 100);
      const message: MessageInfo = {
        name:
          publishInfo.type +
          '#' +
          Buffer.from(publishInfo.name + num.toString()).toString('base64'),
        type: publishInfo.type,
        image: publishInfo.image,
        fileMD5: md5,
        offLineId: publishInfo.offLineId,
        info: Buffer.from(publishInfo.info.replace(/"/g, "'")).toString(
          'base64',
        ),
      };
      // 文件存入json
      const jsonPath = await this.saveJson({
        name: message.name,
        type: publishInfo.type,
        image: publishInfo.image,
        offLineId: publishInfo.offLineId,
        info: publishInfo.info,
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const anchor = require('@coral-xyz/anchor');
      console.log(5);
      // const { sha512 } = await import('@noble/hashes/sha512');
      console.log(4);
      // const ed = await import('@noble/ed25519');
      console.log(6);
      // ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
      ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));

      const secretKey: Uint8Array = new Uint8Array([
        195, 111, 73, 238, 5, 219, 0, 3, 162, 133, 34, 156, 75, 172, 119, 95,
        225, 23, 37, 74, 65, 11, 188, 46, 64, 227, 85, 218, 16, 65, 78, 144,
        103, 149, 58, 113, 68, 116, 23, 19, 204, 81, 187, 246, 251, 169, 46,
        241, 67, 3, 176, 176, 135, 142, 104, 82, 108, 253, 63, 118, 216, 177,
        244, 220,
      ]);
      const pair = anchor.web3.Keypair.fromSecretKey(secretKey);
      console.log('origin privatekey:', pair.secretKey);
      const privatekey = pair.secretKey.subarray(0, 32);
      console.log('privatekey:', privatekey);
      const publicKey = pair.publicKey.toBytes();
      console.log('publickey:', publicKey);
      const jsonFilePath = (
        this.configService.get('ASSETS_HOST') +
        '/' +
        jsonPath
      ).replace(/\\/g, '/');
      const sigMessage = `${message.name}AITEST${jsonFilePath}`;
      console.log('message:', sigMessage);
      const _msg = Buffer.from(sigMessage, 'utf-8');
      const signature = await ed.sign(_msg, privatekey);
      console.log('signature:', signature);

      return {
        name: message.name,
        symbol: 'AITEST',
        uri: jsonFilePath,
        signature: signature.toString(),
      };
    });
  }
}
