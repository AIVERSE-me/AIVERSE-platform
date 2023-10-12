import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FinetuneOutputError } from '../enum/finetune-output-error.enum';
import { FinetuneJobStatus } from 'src/finetune/enum/finetune-job-status.enum';

@ObjectType()
export class FinetuneOutput {
  @Field()
  id: string;

  @Field()
  creator: string;

  @Field()
  usedFinetuneId: string;

  @Field(() => FinetuneJobStatus)
  status: FinetuneJobStatus;
  @Field(() => Int)
  progress: number;
  @Field()
  asset: string;

  @Field()
  prompt: string;

  @Field(() => FinetuneOutputError)
  error: FinetuneOutputError;

  @Field()
  createTime: Date;

  @Field()
  updateTime: Date;
}
