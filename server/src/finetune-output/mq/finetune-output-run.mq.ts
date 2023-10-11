import { GenerateParamsDTO } from 'src/presets/dto/generate-params.dto';
// import { ControlNetUnitDTO } from '../dto/control-net-unit.dto';

export const FINETUNE_OUTPUT_RUN_MQ = 'finetune-output:run';

// https://replicate.com/ai-technology-co-ltd/txt2img_deliberate_v2

export type FinetuneOutputRunPayload = {
  // 生成任务的ID
  kind: 'finetune-output';
  id: string;

  // model?: string;
  // prompt: string;
  // // num_outputs
  // numOutputs: number;
  // height: number;
  // width: number;
  // // num_inference_steps
  // numInferenceSteps: number;
  // // cfg_scale
  // cfgScale: number;
  // // negative_prompt
  // negativePrompt: string;
  // // seed
  // seed: number;

  params: GenerateParamsDTO;
};
