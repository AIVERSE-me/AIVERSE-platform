import { Module } from '@nestjs/common';
import { AiProductService } from './services/ai-product.service';
import { AiProductOutputService } from './services/ai-product-output.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProduct } from './entity/ai-product.entity';
import { AiProductOutput } from './entity/ai-product-output.entity';
import { BullModule } from '@nestjs/bull';
import { SMALL_GPU_TASK_RUN_MQ } from 'src/general-task-queue/small-gpu-task-run.mq';
import { AssetsModule } from 'src/assets/assets.module';
import { GeneralTaskQueueModule } from 'src/general-task-queue/general-task-queue.module';
import { AiProductsResolver } from './resolver/ai-products.resolver';
import { AiProductOutputsResolver } from './resolver/ai-product-outputs.resolver';
import { AiProductOutputDetails } from './entity/ai-product-output-details.entity';
import { PresetsModule } from 'src/presets/presets.module';
import { SegmentModule } from 'src/segment/segment.module';
import { AiProductController } from './ai-product.controller';
import { AiProductSettingsService } from './settings/ai-product.settings';
import { SettingsModule } from 'src/settings/settings.module';
import { AiProductMetadataResolver } from './resolver/ai-model-metadata.resolver';
import { AigcModule } from 'src/aigc/aigc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiProduct,
      AiProductOutput,
      AiProductOutputDetails,
    ]),
    BullModule.registerQueue({
      name: SMALL_GPU_TASK_RUN_MQ,
    }),
    AssetsModule,
    GeneralTaskQueueModule,
    PresetsModule,
    SegmentModule,
    SettingsModule,
    AigcModule,
  ],
  providers: [
    AiProductService,
    AiProductOutputService,
    AiProductsResolver,
    AiProductOutputsResolver,
    AiProductSettingsService,
    AiProductMetadataResolver,
  ],
  exports: [AiProductService, AiProductOutputService],
  controllers: [AiProductController],
})
export class AiProductModule {}
