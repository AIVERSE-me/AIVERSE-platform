import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FinetuneOutputSize {
  @Field(() => Int, { description: '-1' })
  width: number;
  @Field(() => Int, { description: '-1' })
  height: number;
}
