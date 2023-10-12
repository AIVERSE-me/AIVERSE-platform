import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FinetuneOutput } from './entity/finetune-output';
import { FinetuneOutputDetails } from './entity/finetune-output-details';
import { Queue } from 'bull';
import { SMALL_GPU_TASK_RUN_MQ } from 'src/general-task-queue/small-gpu-task-run.mq';
import { InjectQueue } from '@nestjs/bull';

import { ImageUtilsService } from 'src/common/image-utils.service';
import { AssetsService } from 'src/assets/assets.service';
import { FinetunePresetService } from '../finetune/finetune-preset.service';
import { GeneralTaskQueueService } from 'src/general-task-queue/general-task-queue.service';
import { FinetuneOutputRunPayload } from './mq/finetune-output-run.mq';
import {
  FinetuneOutputResultFailedPayload,
  FinetuneOutputResultFinishedPayload,
  FinetuneOutputResultPayload,
  FinetuneOutputResultProgressPayload,
} from './mq/finetune-output-result.mq';
import { SMALL_GPU_TASK_RESULT_MQ } from 'src/general-task-queue/small-gpu-task-result.consumer';
import {
  DataSourceAls,
  InjectTransactionProps,
  TransactionHooks,
  Transactional,
} from '@app/transaction';
import { FinetuneJobStatus } from '../finetune/enum/finetune-job-status.enum';
import { FinetuneOutputParams } from './dto/finetune-output-params.dto';
import { TransactionContextCompatible } from 'src/common/transcation-context';
import { In, Repository } from 'typeorm';
import { FinetuneService } from '../finetune/finetune.service';
import { MarketPersonTemplateService } from 'src/market/service/market-person-template.service';
import { PointsService } from 'src/points/points.service';
import { MarketResourceUsageService } from 'src/market/service/market-resource-usage.service';

const MARKET_RESOURCE_USE_TYPE = 'finetune-output';

@InjectTransactionProps()
@Injectable()
export class FinetuneOutputService {
  private logger = new Logger(FinetuneOutputService.name);
  private readonly BASE_POINTS_COST = 0;

  constructor(
    // @InjectRepository(Finetune)
    // private readonly finetuneRepo: Repository<Finetune>,
    @InjectRepository(FinetuneOutput)
    private readonly outputRepo: Repository<FinetuneOutput>,
    @InjectRepository(FinetuneOutputDetails)
    private readonly detailsRepo: Repository<FinetuneOutputDetails>,

    @InjectQueue(SMALL_GPU_TASK_RUN_MQ)
    private smallGpuTaskRunQueue: Queue<FinetuneOutputRunPayload>,

    private readonly imageUtilsSvc: ImageUtilsService,

    private readonly assetsService: AssetsService,

    private readonly presetSvc: FinetunePresetService,

    private readonly generalTaskService: GeneralTaskQueueService,

    private readonly finetuneService: FinetuneService,

    private readonly marketPersonTemplateService: MarketPersonTemplateService,

    private readonly marketResourceUsageService: MarketResourceUsageService,

    private readonly pointsService: PointsService,
  ) {}

  async onModuleInit() {
    this.generalTaskService.registerHandler<FinetuneOutputResultPayload>({
      queue: SMALL_GPU_TASK_RESULT_MQ,
      selector: (payload) => payload.kind === 'finetune-output',
      handler: async (job) => {
        const { data: payload } = job;
        const outputId = payload.id;
        switch (payload.type) {
          case 'finished': {
            this.logger.log(`fintune-output-result '${outputId}' finished`); // 不打印数据，因为base64数据量太大
            await this.setOutputFinished(outputId, payload);
            break;
          }
          case 'failed': {
            this.logger.log(
              `fintune-output-result '${outputId}' failed ${JSON.stringify(
                payload,
              )}`,
            );
            await this.setOutputFailed(outputId, payload);
            break;
          }
          case 'progress': {
            this.logger.log(
              `fintune-output-result '${outputId}' progress ${payload.progress}`,
            );
            await this.updateOutputProgress(outputId, payload);
            break;
          }
          default: {
            this.logger.error(`unknown output result type: ${job.data.type}`);
            throw new Error('unknown output result type');
          }
        }
      },
    });
  }

  async canCreateFinetuneOutput({
    creator,
    finetuneId,
  }: {
    creator: string;
    finetuneId: string;
  }) {
    const existedNotEndTask = await this.outputRepo.exist({
      where: {
        creator,
        usedFinetune: { id: finetuneId },
        status: In([FinetuneJobStatus.CREATED, FinetuneJobStatus.STARTED]),
      },
    });
    return !existedNotEndTask;
  }

  // 20230904 增加积分开销
  @Transactional()
  async createFinetuneOutputUsePreset(args: {
    creator: string;
    usedFinetuneId: string;
    usedPresetId: string;
    overridePrompt?: string;
  }) {
    const { creator, usedFinetuneId, usedPresetId, overridePrompt } = args;

    if (
      !(await this.canCreateFinetuneOutput({
        creator,
        finetuneId: usedFinetuneId,
      }))
    ) {
      this.logger.warn(
        `user ${creator} has a not end task, can not create new task`,
      );
      throw new Error(`already has a not end task`);
    }

    const finetune = await this.finetuneService.getFinetuneById(usedFinetuneId);

    // const finetune = await this.finetuneRepo.findOneBy({ id: usedFinetuneId });
    if (!finetune) {
      throw new Error(`finetune ${usedFinetuneId} not found`);
    }

    // const preset = await this.presetSvc.getPreset(usedPresetId);
    // if (!preset) {
    //   throw new Error(`preset ${usedPresetId} not found`);
    // }

    const params: FinetuneOutputParams = {
      presetId: usedPresetId,
      overridePrompt,
    };

    const runParams = await this.presetSvc.usePresetById(
      usedPresetId,
      finetune,
      {
        overridePrompt,
      },
    );

    let output = this.outputRepo.create({
      creator,
      status: FinetuneJobStatus.CREATED,
      progress: 0,
      asset: '',
      params,
      // runParams,
    });
    output.usedFinetune = finetune;
    output = await this.outputRepo.save(output);

    let details = this.detailsRepo.create({
      runParams,
    });
    details.output = output;
    details = await this.detailsRepo.save(details);
    this.logger.debug(
      `create finetune output details '${details.id}' for output '${output.id}'`,
    );

    const payload = await this.getOutputRunPayload(output, details);

    let pointsCost = this.BASE_POINTS_COST;

    const marketResource = await this.marketPersonTemplateService.get(
      usedPresetId,
    );
    if (marketResource) {
      const now = new Date();

      const templatePoints = this.marketPersonTemplateService.getCost(
        marketResource,
        now,
      );
      pointsCost += templatePoints;

      await this.marketResourceUsageService.create({
        resType: 'person-template',
        resId: usedFinetuneId,

        useType: MARKET_RESOURCE_USE_TYPE,
        useId: output.id,

        owner: marketResource.owner,
        price: templatePoints,
      });
    }
    output.costPoints = pointsCost;
    output = await this.outputRepo.save(output);

    const ctx = new TransactionContextCompatible();
    await this.pointsService.changeUserPoints(
      {
        uid: creator,
        points: -pointsCost,
        operator: FinetuneOutputService.name,
        desc:
          `create finetune-output` +
          (marketResource ? 'with used market template' : ''),
      },
      { entityManager: ctx.getEntityManager() },
    );

    TransactionHooks.afterCommit(async () => {
      // 发出bull队列任务
      await this.smallGpuTaskRunQueue.add(payload, {
        jobId: output.id,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    });

    return output;
  }

  @Transactional()
  async deleteFinetuneOutput(id: string) {
    const repo = this.outputRepo;
    await repo.delete({ id });
  }

  async getFinetuneOutputById(id: string) {
    const repo = this.outputRepo;
    return repo.findOne({
      where: { id },
      relations: { usedFinetune: true },
    });
  }

  async getFinetuneOutputDetails(outputId: string) {
    const repo = this.detailsRepo;
    return repo.findOne({
      where: {
        output: { id: outputId },
      },
    });
  }

  /**
   * 从runParams中解析图片尺寸
   * 若解析失败,宽高都返回-1
   */
  async getFinetuneOutputSize(
    outputId: string,
  ): Promise<{ width: number; height: number }> {
    const em = DataSourceAls.getStore().datasource.createEntityManager();

    const result = await em
      .createQueryBuilder(FinetuneOutputDetails, 'details')
      .select([
        `details.runParams->>'$.width' as 'width'`,
        `details.runParams->>'$.height' as 'height'`,
      ])
      .where(`details.outputId = :id`)
      .setParameters({ id: outputId })
      .getRawOne();

    return {
      width: result?.width ?? -1,
      height: result?.height ?? -1,
    };
  }

  async queryFinetuneOutputs(args: {
    creator?: string;
    usedFinetuneId?: string;
    status?: FinetuneJobStatus;
    page: number;
    pageSize: number;
  }) {
    const repo = this.outputRepo;

    const { page, pageSize } = args;
    const result = await repo.find({
      where: {
        creator: args.creator,
        usedFinetune: args.usedFinetuneId
          ? {
              id: args.usedFinetuneId,
            }
          : undefined,
        status: args.status,
      },
      order: {
        createTime: 'DESC',
      },
      relations: { usedFinetune: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return result;
  }

  // 更新output进度，只有在output状态为CREATED或STARTED时才能更新
  // 且progress必须大于当前值，否则不更新
  @Transactional()
  async updateOutputProgress(
    id: string,
    payload: FinetuneOutputResultProgressPayload,
  ) {
    const { progress } = payload;

    const output = await this.outputRepo.findOne({
      where: {
        id,
      },
      lock: {
        mode: 'pessimistic_read',
      },
    });
    if (!output) {
      throw new Error(`output ${id} not found`);
    }
    if (
      [FinetuneJobStatus.CREATED, FinetuneJobStatus.STARTED].includes(
        output.status,
      )
    ) {
      if (output.progress >= progress) {
        this.logger.warn(
          `output '${id}' current progress ${output.progress} >= ${progress}, will not update it`,
        );
        return output;
      }
      output.progress = Math.min(progress, 100);
      output.status = FinetuneJobStatus.STARTED;
      return await this.outputRepo.save(output);
    } else {
      this.logger.warn(
        `output '${id}' status is ${output.status}, will not update progress`,
      );
      return output;
    }
  }

  // 设置 output 为已完成状态，将生成的图片存储至output的asset字段
  @Transactional()
  async setOutputFinished(
    id: string,
    payload: FinetuneOutputResultFinishedPayload,
  ) {
    const output = await this.outputRepo.findOne({
      where: {
        id,
      },
      lock: {
        mode: 'pessimistic_read',
      },
    });
    if (!output) {
      throw new Error(`output ${id} not found`);
    }
    if (output.status !== FinetuneJobStatus.STARTED) {
      throw new Error(
        `output ${id} status is ${output.status}, can not set it to FINISHED`,
      );
    }
    const details = await this.detailsRepo.findOne({
      where: {
        output: { id: output.id },
      },
    });
    if (!details) {
      throw new Error(`output ${id} details not found`);
    }

    const { result } = payload;

    // 生成多张的逻辑在创建output时会被拆分成N个生成1张的任务.
    // 因此实际上使用时，只会有一个图片
    const image = result.images[0];

    const buf = await this.imageUtilsSvc.removeSDParams(
      Buffer.from(image, 'base64'),
    );

    const asset = await this.assetsService.storeFromBuffer(
      {
        buffer: buf,
        filename: `${id}.png`,
      },
      new TransactionContextCompatible(),
    );
    // const asset = await this.assetsService.storeFromWeb(
    //   {
    //     url: image,
    //     filename: `${id}.png`,
    //   },
    //   ctx,
    // );
    output.asset = asset;

    // 更新finetune

    // 避免图片数据太大，存储于数据库时产生的性能问题
    details.rawResult = payload;

    output.status = FinetuneJobStatus.FINISHED;
    output.progress = 100;
    await this.detailsRepo.save(details);
    await this.outputRepo.save(output);

    if (output.params.presetId) {
      await this.marketResourceUsageService.confirmForUse({
        useId: output.id,
        useType: MARKET_RESOURCE_USE_TYPE,
      });
      // const res = await this.marketResourceUsageService.get({
      //   resType: 'person-template',
      //   resId: output.params.presetId,
      //   useType: MARKET_RESOURCE_USE_TYPE,
      //   useId: output.id,
      // });
      // if (res) {
      //   await this.marketResourceUsageService.confirm({
      //     resType: 'person-template',
      //     resId: output.params.presetId,
      //     useType: MARKET_RESOURCE_USE_TYPE,
      //     useId: output.id,
      //   });
      // }
    }
  }

  // 设置finetune为失败状态
  @Transactional()
  async setOutputFailed(
    id: string,
    payload: FinetuneOutputResultFailedPayload,
  ) {
    let output = await this.outputRepo.findOne({
      where: {
        id,
      },
      lock: {
        mode: 'pessimistic_read',
      },
    });
    if (!output) {
      throw new Error(`output ${id} not found`);
    }
    if (
      [FinetuneJobStatus.FINISHED, FinetuneJobStatus.ERROR].includes(
        output.status,
      )
    ) {
      throw new Error(
        `output ${id} status is ${output.status}, can not set it to FAILED`,
      );
    }
    const details = await this.detailsRepo.findOne({
      where: {
        output: { id: output.id },
      },
    });
    if (!details) {
      throw new Error(`output ${id} details not found`);
    }
    details.rawResult = payload;
    output.status = FinetuneJobStatus.ERROR;
    await this.detailsRepo.save(details);
    output = await this.outputRepo.save(output);

    // 退还积分
    const ctx = new TransactionContextCompatible();
    await this.pointsService.changeUserPoints(
      {
        uid: output.creator,
        points: output.costPoints,
        operator: FinetuneOutputService.name,
        desc: `refund for finetune output ${output.id} failed`,
      },
      {
        entityManager: ctx.getEntityManager(),
      },
    );

    if (output.params.presetId) {
      await this.marketResourceUsageService.cancelForUse({
        useId: output.id,
        useType: MARKET_RESOURCE_USE_TYPE,
      });
      // const recordId = {
      //   resType: 'person-template',
      //   resId: output.params.presetId,
      //   useType: MARKET_RESOURCE_USE_TYPE,
      //   useId: output.id,
      // };
      // const res = await this.marketResourceUsageService.get(recordId);
      // if (res) {
      //   await this.marketResourceUsageService.cancel(recordId);
      // }
    }

    return output;
  }

  // ====== Utils

  private async getOutputRunPayload(
    output: FinetuneOutput,
    details: FinetuneOutputDetails,
  ): Promise<FinetuneOutputRunPayload> {
    return {
      kind: 'finetune-output',
      // 理论上所有的参数都在runParams中了, 为了向前兼容及弥补可能存在的逻辑漏洞，还是保留以下默认参数
      id: output.id,
      params: details.runParams,
    };
  }
}
