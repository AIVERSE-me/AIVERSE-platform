import { GenerateParamsDTO } from '../../presets/dto/generate-params.dto';

export interface AiProductOutputRunPayload {
  kind: 'ai-product-output';
  id: string;
  params: GenerateParamsDTO;
}

export interface AiProductOutputResultFinishedPayload {
  kind: 'ai-product-output';
  type: 'finished';
  id: string;
  result: {
    images: string[];
  };
}
export interface AiProductOutputResultErrorPayload {
  kind: 'ai-product-output';
  type: 'error';
  id: string;
  error: string;
}
export interface AiProductOutputResultProgressPayload {
  kind: 'ai-product-output';
  type: 'progress';
  id: string;
  progress: number;
}

export type AiProductOutputResultPayload =
  | AiProductOutputResultFinishedPayload
  | AiProductOutputResultErrorPayload
  | AiProductOutputResultProgressPayload;
