import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { FinetuneOutput } from './model/finetune-output.model';
import { FinetuneOutput as FinetuneOutputEtt } from './entity/finetune-output';
import { UID } from 'src/auth/uid.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FinetuneService } from '../finetune/finetune.service';
import { AssetsService } from 'src/assets/assets.service';
import { FinetuneOutputError } from './enum/finetune-output-error.enum';
import { FinetuneJobStatus } from '../finetune/enum/finetune-job-status.enum';
import { FinetuneOutputSize } from './model/finetune-output-size';
import { ImageUrls } from 'src/assets/model/image-urls.model';
import { FinetuneOutputService } from './finetune-output.service';

@Resolver(() => FinetuneOutput)
export class FinetuneOutputResolver {
  constructor(
    private readonly service: FinetuneOutputService,
    private readonly finetuneService: FinetuneService,
    private readonly assetsService: AssetsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [FinetuneOutput], {
    description: '查看我在某微调模型下的的outputs',
  })
  async finetuneOutputs(
    @UID() uid: string,
    @Args('finetuneId') finetuneId: string,
    @Args('page', { defaultValue: 1 }) page: number,
    @Args('pageSize', { defaultValue: 10 }) pageSize: number,
  ): Promise<FinetuneOutput[]> {

    const outputs = await this.service.queryFinetuneOutputs({
      creator: uid,
      usedFinetuneId: finetuneId,
      page,
      pageSize,
    });
    return Promise.all(outputs.map(this.toMdl.bind(this)));
  }
  // @UseGuards(JwtAuthGuard)
  @Query(() => FinetuneOutput, {
    description: '查看某output,该outputs的creator必须是当前用户',
  })
  async finetuneOutput(
    // @UID() uid: string,
    @Args('id') id: string,
  ): Promise<FinetuneOutput> {
    const output = await this.service.getFinetuneOutputById(id);
    // if (output.creator !== uid) {
    //   throw new Error('current user is not creator of the finetune');
    // }
    return this.toMdl(output);
  }
  // @UseGuards(JwtAuthGuard)
  // @Mutation(() => FinetuneOutput, { description: '创建output' })
  // async createFinetuneOutput(
  //   @UID() uid: string,
  //   @Args('finetuneId') finetuneId: string,
  //   @Args('prompt') prompt: string,
  //   @Args('model', { nullable: true }) model: string,
  // ) {
  //   const output = await this.service.createFinetuneOutput({
  //     creator: uid,
  //     usedFinetuneId: finetuneId,
  //     prompt,
  //     model,
  //   });
  //   return this.toMdl(output);
  // }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => FinetuneOutput, { description: '以模板创建output' })
  async createFinetuneOutputUsePreset(
    @UID() uid: string,
    @Args('finetuneId') finetuneId: string,
    @Args('presetId') presetId: string,
    @Args('overridePrompt', { nullable: true }) overridePrompt?: string,
  ) {
    const output = await this.service.createFinetuneOutputUsePreset({
      creator: uid,
      usedFinetuneId: finetuneId,
      usedPresetId: presetId,
      overridePrompt,
    });
    return this.toMdl(output);
  }

  private async toMdl(obj: FinetuneOutputEtt): Promise<FinetuneOutput> {
    let error: FinetuneOutputError = FinetuneOutputError.NONE;
    if (obj.status === FinetuneJobStatus.ERROR) {
      const details = await this.service.getFinetuneOutputDetails(obj.id);
      if (details.rawResult?.message?.includes('NSFW')) {
        error = FinetuneOutputError.NSFW;
      }
      error = FinetuneOutputError.BUSY;
    }
    return {
      ...obj,
      usedFinetuneId: obj.usedFinetune.id,
      prompt: obj.params?.prompt || '',
      error,
    };
  }

  @Mutation(() => String, {
    description: '',
  })
  @UseGuards(JwtAuthGuard)
  async deleteFinetuneOutput(@UID() uid: string, @Args('id') id: string) {
    const output = await this.service.getFinetuneOutputById(id);
    if (output.creator !== uid) {
      throw new Error('current user is not creator of the finetune');
    }
    await this.service.deleteFinetuneOutput(id);
    return id;
  }

  @ResolveField(() => String)
  async token(@Parent() output: FinetuneOutput) {
    // return this.assetsService.getAssetToken(output.asset);
    const finetune = await this.finetuneService.getFinetuneById(
      output.usedFinetuneId,
    );
    return finetune?.token || '';
  }

  @ResolveField(() => String)
  async image(@Parent() product: FinetuneOutput) {
    return this.assetsService.getAssetUrl(product.asset, {
      completedUrl: true,
    });
  }

  @ResolveField(() => ImageUrls)
  async imageUrls(@Parent() product: FinetuneOutput) {
    return this.assetsService.getImageUrls(product.asset);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [FinetuneOutput])
  async progressingFinetuneOutputs(
    @UID() uid: string,
    @Args('finetuneId', { nullable: true }) finetuneId?: string,
  ) {
    const created = await this.service.queryFinetuneOutputs({
      creator: uid,
      usedFinetuneId: finetuneId,
      status: FinetuneJobStatus.CREATED,
      page: 1,
      pageSize: 100,
    });
    const started = await this.service.queryFinetuneOutputs({
      creator: uid,
      usedFinetuneId: finetuneId,
      status: FinetuneJobStatus.STARTED,
      page: 1,
      pageSize: 100,
    });
    return Promise.all([...started, ...created].map(this.toMdl.bind(this)));
  }

  @ResolveField(() => FinetuneOutputSize)
  async size(@Parent() output: FinetuneOutput) {
    return await this.service.getFinetuneOutputSize(output.id);
  }
}
