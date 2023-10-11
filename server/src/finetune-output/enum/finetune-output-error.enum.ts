import { registerEnumType } from '@nestjs/graphql';

export enum FinetuneOutputError {
  NONE = 'none',
  NSFW = 'nsfw',
  BUSY = 'busy',
}

registerEnumType(FinetuneOutputError, {
  name: 'FinetuneOutputError',
  description: 'fail',
});
