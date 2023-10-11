import { Module } from '@nestjs/common';
import { FinetuneOutputService } from './finetune-output.service';
import { FinetuneOutputResolver } from './finetune-output.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinetuneOutput } from './entity/finetune-output';
import { FinetuneOutputDetails } from './entity/finetune-output-details';
import { BullModule } from '@nestjs/bull';
import { SMALL_GPU_TASK_RUN_MQ } from 'src/general-task-queue/small-gpu-task-run.mq';
import { AssetsModule } from 'src/assets/assets.module';
import { GeneralTaskQueueModule } from 'src/general-task-queue/general-task-queue.module';
import { FinetuneModule } from 'src/finetune/finetune.module';
import { PointsModule } from 'src/points/points.module';
import { MarketModule } from 'src/market/market.module';

@Module({
  imports: [
    AssetsModule,
    FinetuneModule,
    TypeOrmModule.forFeature([FinetuneOutput, FinetuneOutputDetails]),
    BullModule.registerQueue({
      name: SMALL_GPU_TASK_RUN_MQ,
    }),
    GeneralTaskQueueModule,
    PointsModule,
    MarketModule,
  ],
  providers: [FinetuneOutputService, FinetuneOutputResolver],
  exports: [FinetuneOutputService],
})
export class FinetuneOutputModule {}
