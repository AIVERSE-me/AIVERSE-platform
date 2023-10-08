import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AiProductOutputCustomParamsInput {
  @Field({ nullable: true })
  prompt?: string;
  @Field({ nullable: true })
  steps?: number;
  @Field({ nullable: true })
  cfg_scale?: number;
  @Field({ nullable: true })
  denoising_strength?: number;
}
