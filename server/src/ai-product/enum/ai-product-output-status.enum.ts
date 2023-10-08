import { registerEnumType } from '@nestjs/graphql';

export enum AiProductOutputStatus {
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
}

registerEnumType(AiProductOutputStatus, {
  name: 'AiProductOutputStatus',
});
