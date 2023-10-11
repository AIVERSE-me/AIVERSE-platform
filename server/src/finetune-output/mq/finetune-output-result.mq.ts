export const FINETUNE_OUTPUT_RESULT_MQ = 'finetune-output:result';

export type FinetuneOutputResultPayload =
  | FinetuneOutputResultFinishedPayload
  | FinetuneOutputResultFailedPayload
  | FinetuneOutputResultProgressPayload;

export type FinetuneOutputResultFinishedPayload = {
  type: 'finished';
  kind: 'finetune-output';
  id: string;
  result: {
    images: string[];
  };
};

export type FinetuneOutputResultFailedPayload = {
  type: 'failed';
  kind: 'finetune-output';
  id: string;
  // rawResult: any;
  error: string;
};

export type FinetuneOutputResultProgressPayload = {
  type: 'progress';
  kind: 'finetune-output';
  id: string;
  progress: number;
};
