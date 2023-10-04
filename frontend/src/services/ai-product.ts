import { client } from '@/services/index';
import { gql } from 'graphql-request';

export const createAIModel = async (params: {
  layerId: number;
  maskedOriAssetId: string;
  oriAssetId: string;
  segmentTaskId: string;
}) => {
  return client.request<{
    createAiModelFromSegmentTaskLayer: API.AIModel;
  }>(
    gql`
      mutation createAiModelFromSegmentTaskLayer(
        $layerId: Int!
        $maskedOriAssetId: String!
        $oriAssetId: String!
        $segmentTaskId: String!
      ) {
        createAiModelFromSegmentTaskLayer(
          layerId: $layerId
          maskedOriAssetId: $maskedOriAssetId
          oriAssetId: $oriAssetId
          segmentTaskId: $segmentTaskId
        ) {
          createTime
          id
          maskImg
          maskImgUrl
          maskedOriImg
          maskedOriImgUrl
          oriImg
          oriImgUrl
        }
      }
    `,
    params,
  );
};

export const createAIProduct = async (params: {
  layerId: number;
  maskedOriAssetId: string;
  oriAssetId: string;
  segmentTaskId: string;
}) => {
  return client.request<{
    createAiProductFromSegmentTaskLayer: API.AIProduct;
  }>(
    gql`
      mutation createAiProductFromSegmentTaskLayer(
        $layerId: Int!
        $maskedOriAssetId: String!
        $oriAssetId: String!
        $segmentTaskId: String!
      ) {
        createAiProductFromSegmentTaskLayer(
          layerId: $layerId
          maskedOriAssetId: $maskedOriAssetId
          oriAssetId: $oriAssetId
          segmentTaskId: $segmentTaskId
        ) {
          createTime
          id
          maskImg
          maskImgUrl
          maskedOriImg
          maskedOriImgUrl
          oriImg
          oriImgUrl
        }
      }
    `,
    params,
  );
};

export const createAIModelOutput = async (params: {
  customParams?: {
    cfg_scale?: number;
    denoising_strength?: number;
    prompt?: string;
    steps?: number;
  };
  modelId: string;
  presetId: string;
}) => {
  return client.request<{ createAiModelOutput: API.AIModelOutput }>(
    gql`
      mutation createAiModelOutput(
        $customParams: AiModelOutputCustomParamsInput
        $modelId: String!
        $presetId: String!
      ) {
        createAiModelOutput(
          customParams: $customParams
          modelId: $modelId
          presetId: $presetId
        ) {
          id
        }
      }
    `,
    params,
  );
};

export const createAIProductOutput = async (params: {
  customParams?: {
    cfg_scale?: number;
    denoising_strength?: number;
    prompt?: string;
    steps?: number;
  };
  productId: string;
  presetId: string;
}) => {
  return client.request<{ createAiProductOutput: API.AIProductOutput }>(
    gql`
      mutation createAiProductOutput(
        $customParams: AiProductOutputCustomParamsInput
        $presetId: String!
        $productId: String!
      ) {
        createAiProductOutput(
          customParams: $customParams
          presetId: $presetId
          productId: $productId
        ) {
          id
        }
      }
    `,
    params,
  );
};

export const deleteAIModel = (id: string) => {
  return client.request(
    gql`
      mutation deleteAiModel($id: String!) {
        deleteAiModel(id: $id)
      }
    `,
    { id },
  );
};

export const deleteAIProduct = (id: string) => {
  return client.request(
    gql`
      mutation deleteAiProduct($id: String!) {
        deleteAiProduct(id: $id)
      }
    `,
    { id },
  );
};

export const deleteAIModelOutput = (id: string) => {
  return client.request(
    gql`
      mutation deleteAiModelOutput($id: String!) {
        deleteAiModelOutput(id: $id)
      }
    `,
    { id },
  );
};

export const deleteAIProductOutput = (id: string) => {
  return client.request(
    gql`
      mutation deleteAiProductOutput($id: String!) {
        deleteAiProductOutput(id: $id)
      }
    `,
    { id },
  );
};

export const getAIModel = async (id: string) => {
  return client.request<{ aiModel: API.AIModel }>(
    gql`
      query aiModel($id: String!) {
        aiModel(id: $id) {
          createTime
          id
          maskImg
          maskImgUrl
          maskedOriImg
          maskedOriImgUrl
          oriImg
          oriImgUrl
        }
      }
    `,
    { id },
  );
};

export const getAIProduct = async (id: string) => {
  return client.request<{ aiProduct: API.AIProduct }>(
    gql`
      query aiProduct($id: String!) {
        aiProduct(id: $id) {
          createTime
          id
          maskImg
          maskImgUrl
          maskedOriImg
          maskedOriImgUrl
          oriImg
          oriImgUrl
        }
      }
    `,
    { id },
  );
};

export const getAIModels = async (page: number, pageSize: number) => {
  return client.request<{ aiModels: API.AIModel[] }>(
    gql`
      query aiModels($page: Float!, $pageSize: Float!) {
        aiModels(page: $page, pageSize: $pageSize) {
          createTime
          id
          maskImg
          maskImgUrl
          maskedOriImg
          maskedOriImgUrl
          oriImg
          oriImgUrl
        }
      }
    `,
    { page, pageSize },
  );
};

export const getAIProducts = async (page: number, pageSize: number) => {
  return client.request<{
    aiProducts: API.AIProduct[];
  }>(
    gql`
      query aiProducts($page: Float!, $pageSize: Float!) {
        aiProducts(page: $page, pageSize: $pageSize) {
          createTime
          id
          maskImg
          maskImgUrl
          maskedOriImg
          maskedOriImgUrl
          oriImg
          oriImgUrl
        }
      }
    `,
    { page, pageSize },
  );
};

export const getAIModelOutput = async (id: string) => {
  return client.request<{ aiModelOutput: API.AIModelOutput }>(
    gql`
      query aiModelOutput($id: String!) {
        aiModelOutput(id: $id) {
          asset
          createTime
          error
          hr {
            error
            id
            imageUrl
            progress
            status
          }
          id
          imageUrl
          imageUrls {
            small
            medium
            origin
          }
          modelId
          progress
          status
        }
      }
    `,
    { id },
  );
};

export const getAIProductOutput = async (id: string) => {
  return client.request<{ aiProductOutput: API.AIProductOutput }>(
    gql`
      query aiProductOutput($id: String!) {
        aiProductOutput(id: $id) {
          asset
          createTime
          error
          hr {
            error
            id
            imageUrl
            progress
            status
          }
          id
          imageUrl
          imageUrls {
            small
            medium
            origin
          }
          productId
          progress
          status
        }
      }
    `,
    { id },
  );
};

export const getAIModelOutputs = async (params: {
  modelId?: string;
  page: number;
  pageSize: number;
}) => {
  return client.request<{
    aiModelOutputs: API.AIModelOutput[];
  }>(
    gql`
      query aiModelOutputs($modelId: String, $page: Float!, $pageSize: Float!) {
        aiModelOutputs(modelId: $modelId, page: $page, pageSize: $pageSize) {
          asset
          createTime
          error
          hr {
            error
            id
            imageUrl
            progress
            status
          }
          id
          imageUrl
          imageUrls {
            small
            medium
            origin
          }
          modelId
          progress
          status
        }
      }
    `,
    params,
  );
};

export const getAIProductOutputs = async (params: {
  productId?: string;
  page: number;
  pageSize: number;
}) => {
  return client.request<{
    aiProductOutputs: API.AIProductOutput[];
  }>(
    gql`
      query aiProductOutputs(
        $productId: String
        $page: Float!
        $pageSize: Float!
      ) {
        aiProductOutputs(
          productId: $productId
          page: $page
          pageSize: $pageSize
        ) {
          asset
          createTime
          error
          hr {
            error
            id
            imageUrl
            progress
            status
          }
          id
          imageUrl
          imageUrls {
            small
            medium
            origin
          }
          productId
          progress
          status
        }
      }
    `,
    params,
  );
};

export const getGeneratePresets = async (
  catalog: string,
  gender?: API.PresetGender,
  page = 1,
  pageSize = 9999,
) => {
  return await client.request<{
    generatePresets: API.GeneratePreset[];
    generatePresetsCount: number;
  }>(
    gql`
      query generatePresets(
        $catalog: String!
        $gender: PresetGender
        $page: Float!
        $pageSize: Float!
      ) {
        generatePresets(
          catalog: $catalog
          gender: $gender
          page: $page
          pageSize: $pageSize
        ) {
          id
          createTime
          displayImgUrl
          gender
          marketResource {
            free
            freeEnd
            id
            price
          }
          name
        }
        generatePresetsCount(catalog: $catalog, gender: $gender)
      }
    `,
    gender ? { catalog, gender, page, pageSize } : { catalog, page, pageSize },
  );
};

export const getGeneratePreset = async (id: string) => {
  return (
    await client.request<{
      generatePreset: API.GeneratePreset;
    }>(
      gql`
        query generatePreset($id: String!) {
          generatePreset(id: $id) {
            catalogDetails {
              titleEn
              titleZh
            }
            createTime
            displayImgUrl
            gender
            id
            marketResource {
              hidden
              id
              published
              reviewReason
              reviewStatus
            }
            marketUsage {
              summary {
                count
                prices
              }
            }
            name
          }
        }
      `,
      { id },
    )
  ).generatePreset;
};

export const getGeneratePresetDetailed = async (id: string) => {
  return (
    await client.request<{
      generatePreset: API.GeneratePreset;
    }>(
      gql`
        query generatePreset($id: String!) {
          generatePreset(id: $id) {
            catalogDetails {
              titleEn
              titleZh
            }
            createTime
            displayImgUrl
            gender
            id
            marketResource {
              hidden
              id
              published
              reviewReason
              reviewStatus
            }
            marketUsage {
              summary {
                count
                prices
              }
            }
            name
            params {
              ... on ImageGenerateParamsImg2Img {
                type
                base_model
                img2imgPrompt: prompt
                negative_prompt
                init_images
                sampler_name
                steps
                seed
                cfg_scale
                restore_faces
                denoising_strength
                alwayson_scripts {
                  ADetailer {
                    args {
                      ad_model
                    }
                  }
                  controlnet {
                    args {
                      model
                      module
                      weight
                      input_image
                    }
                  }
                }
              }
              ... on ImageGenerateParamsTxt2Img {
                type
                base_model
                prompt
                negative_prompt
                width
                height
                sampler_name
                steps
                seed
                cfg_scale
                restore_faces
                alwayson_scripts {
                  ADetailer {
                    args {
                      ad_model
                    }
                  }
                  controlnet {
                    args {
                      model
                      module
                      weight
                      input_image
                    }
                  }
                }
              }
            }
          }
        }
      `,
      { id },
    )
  ).generatePreset;
};

export const createAIModelOutputHr = async (id: string) => {
  return (
    await client.request<{ createAiModelOutputHr: API.HrTask }>(
      gql`
        mutation createAiModelOutputHr($id: String!) {
          createAiModelOutputHr(id: $id) {
            error
            id
            imageUrl
            imageUrls {
              small
              medium
              origin
            }
            progress
            status
          }
        }
      `,
      { id },
    )
  ).createAiModelOutputHr;
};

export const createAIProductOutputHr = async (id: string) => {
  return (
    await client.request<{ createAiProductOutputHr: API.HrTask }>(
      gql`
        mutation createAiProductOutputHr($id: String!) {
          createAiProductOutputHr(id: $id) {
            error
            id
            imageUrl
            imageUrls {
              small
              medium
              origin
            }
            progress
            status
          }
        }
      `,
      { id },
    )
  ).createAiProductOutputHr;
};

export const getAIModelOutputHr = async (id: string) => {
  return (
    await client.request<{ aiModelOutput: API.AIModelOutput }>(
      gql`
        query aiModelOutput($id: String!) {
          aiModelOutput(id: $id) {
            hr {
              error
              id
              imageUrl
              imageUrls {
                small
                medium
                origin
              }
              progress
              status
            }
          }
        }
      `,
      { id },
    )
  ).aiModelOutput.hr;
};

export const getAIProductOutputHr = async (id: string) => {
  return (
    await client.request<{ aiProductOutput: API.AIProductOutput }>(
      gql`
        query aiProductOutput($id: String!) {
          aiProductOutput(id: $id) {
            hr {
              error
              id
              imageUrl
              imageUrls {
                small
                medium
                origin
              }
              progress
              status
            }
          }
        }
      `,
      { id },
    )
  ).aiProductOutput.hr;
};

export const getAIModelMetadata = async () => {
  return (
    await client.request<{ aiModelMetadata: API.AiModelMetadataModel }>(gql`
      query aiModelMetadata {
        aiModelMetadata {
          maskInvertedUsePresetId
          options {
            id
            code
            label
            options {
              image
              label
              order
              value
            }
          }
          usePresetId
        }
      }
    `)
  ).aiModelMetadata;
};

export const getAIProductMetadata = async () => {
  return (
    await client.request<{ aiProductMetadata: API.AIProductMetadataModel }>(gql`
      query aiProductMetadata {
        aiProductMetadata {
          customUsePresetId
        }
      }
    `)
  ).aiProductMetadata;
};

export const getAIModelUserPrivateModels = async () => {
  return (
    await client.request<{
      aiModelUserPrivateModels: API.AIModelUserPrivateModel[];
    }>(
      gql`
        query aiModelUserPrivateModels {
          aiModelUserPrivateModels {
            finetuneId
            gender
            imageUrls {
              medium
              origin
              small
            }
            uniqueToken
          }
        }
      `,
    )
  ).aiModelUserPrivateModels;
};

export const addAIModelUserPrivateModel = async (finetuneId: string) => {
  return (
    await client.request<{
      addAiModelUserPrivateModel: API.AIModelUserPrivateModel;
    }>(
      gql`
        mutation addAiModelUserPrivateModel($finetuneId: String!) {
          addAiModelUserPrivateModel(finetuneId: $finetuneId) {
            finetuneId
            gender
            imageUrls {
              medium
              origin
              small
            }
            uniqueToken
          }
        }
      `,
      { finetuneId },
    )
  ).addAiModelUserPrivateModel;
};

export const removeAIModelUserPrivateModel = async (finetuneId: string) => {
  return (
    await client.request(
      gql`
        mutation removeAiModelUserPrivateModel($finetuneId: String!) {
          removeAiModelUserPrivateModel(finetuneId: $finetuneId)
        }
      `,
      { finetuneId },
    )
  ).addAiModelUserPrivateModel;
};
