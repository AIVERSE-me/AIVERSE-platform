import { GenericOutputBasicType } from '@/components/GenericOutput/GenericOutputPanel';

export const isOutputInProgress = (output: GenericOutputBasicType) => {
  return ['CREATED', 'STARTED'].includes(output.status);
};

export const isHrInProgress = (output: GenericOutputBasicType) => {
  return ['CREATED', 'STARTED'].includes(output.hr?.status || '');
};
