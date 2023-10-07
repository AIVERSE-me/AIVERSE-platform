import { Field, ObjectType } from '@nestjs/graphql';
import { AiProductOutputStatus } from '../enum/ai-product-output-status.enum';

@ObjectType('AiProductOutput')
export class AiProductOutputModel {
  @Field()
  id: string;

  @Field()
  productId: string;

  @Field()
  asset: string;

  @Field(() => AiProductOutputStatus)
  status: AiProductOutputStatus;

  @Field()
  progress: number;

  @Field({ nullable: true })
  error: string;

  @Field()
  createTime: Date;

  @Field()
  updateTime: Date;
}
