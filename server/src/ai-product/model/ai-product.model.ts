import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('AiProduct')
export class AiProductModel {
  @Field()
  id: string;

  @Field()
  oriImg: string;

  @Field()
  maskImg: string;

  @Field()
  maskedOriImg: string;

  @Field()
  createTime: Date;
}
