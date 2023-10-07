import {
  Body,
  Controller,
  Logger,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AssetsService } from 'src/assets/assets.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UID } from 'src/auth/uid.decorator';
import { TransactionContext } from 'src/common/transcation-context';
import { DataSource } from 'typeorm';
import sharp = require('sharp');
import { ImageUtilsService } from 'src/common/image-utils.service';

class Base64ImageCreateDTO {
  images: string[];
}

@Controller('api/ai-product')
export class AiProductController {
  private readonly logger = new Logger(AiProductController.name);

  private readonly IMAGE_MAX_HEIGHT = 1024;
  private readonly IMAGE_MAX_WIDTH = 1024;

  constructor(
    private readonly assetsService: AssetsService,
    private readonly datasource: DataSource,
    private readonly imageUtilsService: ImageUtilsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('images')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadImages(
    @UID() uid: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const ctx = new TransactionContext(this.datasource);

    return await ctx.run(async () => {
      const assets: string[] = [];
      for (const file of files) {
        const compressedBuffer = await this.compressImage(file.buffer);
        const assetId = await this.assetsService.storeFromBuffer(
          {
            buffer: compressedBuffer,
            filename: file.originalname,
          },
          ctx,
        );
        this.logger.log(`user '${uid}' upload image '${assetId}'`);
        assets.push(assetId);
      }
      return await Promise.all(
        assets.map(async (asset) => {
          const url = await this.assetsService.getAssetUrl(
            asset,
            {
              completedUrl: true,
            },
            ctx,
          );
          return { asset, url };
        }),
      );
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('images_base64')
  async uploadImagesBase64(
    @UID() uid: string,
    @Body() dto: Base64ImageCreateDTO,
  ) {
    const ctx = new TransactionContext(this.datasource);

    return await ctx.run(async () => {
      const assets: string[] = [];
      for (const file of dto.images) {
        try {
          const base64 = file.split(',')[1];

          const buffer = Buffer.from(base64, 'base64');

          const compressedBuffer = await this.compressImage(buffer);

          const imageType = await this.imageUtilsService.detectImageType(
            compressedBuffer,
          );

          const filename = `image.${imageType.split('/')[1]}`;
          const assetId = await this.assetsService.storeFromBuffer(
            {
              buffer: compressedBuffer,
              filename: filename,
            },
            ctx,
          );
          this.logger.log(`user '${uid}' upload image '${assetId}'`);
          assets.push(assetId);
        } catch (err) {
          console.log(err);
        }
      }
      return await Promise.all(
        assets.map(async (asset) => {
          const url = await this.assetsService.getAssetUrl(
            asset,
            {
              completedUrl: true,
            },
            ctx,
          );
          return { asset, url };
        }),
      );
    });
  }

  private async compressImage(buffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();

    let pipe = sharp(buffer).rotate();

    if (
      metadata.width > this.IMAGE_MAX_WIDTH ||
      metadata.height > this.IMAGE_MAX_HEIGHT
    ) {
      pipe = pipe.resize(this.IMAGE_MAX_WIDTH, this.IMAGE_MAX_HEIGHT, {
        fit: 'inside',
      });
    }

    const { data, info } = await pipe.toBuffer({ resolveWithObject: true });
    this.logger.verbose(
      `compress image from (${metadata.width}, ${metadata.height}) to (${info.width}, ${info.height})`,
    );
    return data;
  }
}
