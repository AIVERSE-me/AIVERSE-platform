import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import sharp = require('sharp');

@Injectable()
export class ImageUtilsService {
  private readonly logger = new Logger(ImageUtilsService.name);

  constructor(private readonly httpService: HttpService) {}

  async removeSDParams(image: Buffer): Promise<Buffer> {
    this.logger.verbose('remove SD params');
    return await sharp(image).rotate().toBuffer();
  }

  async detectImageType(image: Buffer) {
    const it = (await eval(
      `import('image-type')`,
    )) as typeof import('image-type');
    const result = await it.default(image);
    return result.mime;
  }

  async readImageMetadata(image: Buffer): Promise<{
    width: number;
    height: number;
  }> {
    const metadata = await sharp(image).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  }

  async downloadImageFromurl(url: string): Promise<Buffer> {
    this.logger.log(`download '${url}'`);
    const { data } = await lastValueFrom(
      this.httpService.get(url, {
        responseType: 'arraybuffer',
        onDownloadProgress: (ev) => {
          this.logger.verbose(
            `download progress: ${
              ev.total === 0 ? '--' : Math.floor((ev.loaded / ev.total) * 100)
            }% ${ev.loaded}/${ev.total}`,
          );
        },
      }),
    );

    return Buffer.from(data);
  }
}
