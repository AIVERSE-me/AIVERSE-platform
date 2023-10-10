import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Size', { description: '' })
export class SizeModel {
  @Field(() => Int, { description: '-' })
  width: number;
  @Field(() => Int, { description: '-' })
  height: number;
}

export class UnkownSizeModel extends SizeModel {
  width = -1;
  height = -1;
}
