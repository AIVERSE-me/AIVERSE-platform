export const WorkshopParams: {
  sizes: {
    label: string;
    width: number;
    height: number;
  }[];
  sampling: string[];
  controlNet: {
    type: string;
    preprocessors: string[];
    model: string;
  }[];
  aDetailer: any;
} = {
  sizes: [
    {
      label: '1:1',
      width: 512,
      height: 512,
    },
    { label: '4:3', width: 800, height: 600 },
    { label: '3:4', width: 600, height: 800 },
    { label: '16:9', width: 800, height: 450 },
    { label: '9:16', width: 450, height: 800 },
  ],
  sampling: [
    'Euler a',
    'Euler',
    'DPM++ 2S a Karras',
    'DPM++ 2M Karras',
    'DPM++ SDE Karras',
    'DPM++ 2M SDE Karras',
  ],
  controlNet: [
    {
      type: 'edge-detection',
      preprocessors: ['canny'],
      model: 'control_v11p_sd15_canny',
    },
    {
      type: 'depth-detection',
      preprocessors: ['depth_leres++', 'depth_midas', 'depth_zoe'],
      model: 'control_v11f1p_sd15_depth',
    },
    {
      type: 'pose-detection',
      preprocessors: [
        'openpose',
        'openpose_face',
        'openpose_faceonly',
        'openpose_full',
        'openpose_hand',
      ],
      model: 'control_v11p_sd15_openpose',
    },
    {
      type: 'lineart',
      preprocessors: [
        'lineart_anime',
        'lineart_anime_denoise',
        'lineart_coarse',
        'lineart_realistic',
        'lineart_standard (from white bg & black line)',
      ],
      model: 'control_v11p_sd15_lineart',
    },
  ],
  aDetailer: {
    args: [
      {
        ad_model: 'face_yolov8n.pt',
      },
    ],
  },
};

export const WORKSHOP_DEFAULT_NEGATIVE_PROMPT =
  'lowres, worst quality, low quality, cropped, normal quality, artifacts, signature, watermark, blurry, missing arms, bad hands, error, bad feet, missing fingers, extra digit, artist name, (nude), (nsfw), ';
