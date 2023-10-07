import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AiProductMetadataModel {
  @Field({ description: 'PresetId' })
  customUsePresetId: string;
}
