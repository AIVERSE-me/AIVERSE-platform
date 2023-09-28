import { client } from '@/services/index';
import { gql } from 'graphql-request';

export const createAiWorkImage = async (
  params: API.ImageGenerateParamsInput,
) => {
  return (
    await client.request<{ createAiWorkImage: API.AiWorkImage }>(
      gql`
        mutation createAiWorkImage($params: ImageGenerateParamsInput!) {
          createAiWorkImage(params: $params) {
            id
          }
        }
      `,
      { params },
    )
  ).createAiWorkImage;
};

export const createInterrogate = async (image: string) => {
  return (
    await client.request<{ createInterrogate: API.Interrogate }>(
      gql`
        mutation createInterrogate($image: String!) {
          createInterrogate(image: $image) {
            completed
            failed
            id
            text
          }
        }
      `,
      { image },
    )
  ).createInterrogate;
};

export const createMarketPersonTemplate = async (
  input: API.CreatePersonTemplateInput,
  price: API.PriceSettingsInput,
) => {
  return (
    await client.request<{
      createMarketPersonTemplate: API.AiWorkImage;
    }>(
      gql`
        mutation createMarketPersonTemplate(
          $input: CreatePersonTemplateInput!
          $price: PriceSettingsInput!
        ) {
          createMarketPersonTemplate(input: $input, price: $price) {
            asset
            createTime
            creator
            error
            id
            imageUrls {
              small
              medium
              origin
            }
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
            personTemplate {
              id
              marketResource {
                id
              }
            }
            progress
            status
            usedMarketModelIds
          }
        }
      `,
      {
        input,
        price,
      },
    )
  ).createMarketPersonTemplate;
};

export const deleteAiWorkImage = async (id: string) => {
  return await client.request(
    gql`
      mutation deleteAiWorkImage($id: String!) {
        deleteAiWorkImage(id: $id)
      }
    `,
    {
      id,
    },
  );
};

export const deleteMarketPersonTemplate = async (presetId: string) => {
  return await client.request(
    gql`
      mutation deleteMarketPersonTemplate($presetId: String!) {
        deleteMarketPersonTemplate(presetId: $presetId)
      }
    `,
    {
      presetId,
    },
  );
};

export const deletePrivateModel = async (modelId: string) => {
  return await client.request(
    gql`
      mutation deletePrivateModel($modelId: String!) {
        deletePrivateModel(modelId: $modelId)
      }
    `,
    {
      modelId,
    },
  );
};

export const publishMarketPersonTemplate = async (presetId: string) => {
  return await client.request<{
    publishMarketPersonTemplate: API.GeneratePreset;
  }>(
    gql`
      mutation publishMarketPersonTemplate($presetId: String!) {
        publishMarketPersonTemplate(presetId: $presetId) {
          id
        }
      }
    `,
    { presetId },
  );
};

export const publishPrivateModel = async (modelId: string) => {
  return await client.request<{
    publishPrivateModel: API.MarketResource;
  }>(
    gql`
      mutation publishPrivateModel($modelId: String!) {
        publishPrivateModel(modelId: $modelId) {
          id
        }
      }
    `,
    { modelId },
  );
};

export const setMarketPersonTemplateHidden = async (
  hidden: boolean,
  presetId: string,
) => {
  return await client.request<{
    setMarketPersonTemplateHidden: API.GeneratePreset;
  }>(
    gql`
      mutation setMarketPersonTemplateHidden(
        $hidden: Boolean!
        $presetId: String!
      ) {
        setMarketPersonTemplateHidden(hidden: $hidden, presetId: $presetId) {
          id
        }
      }
    `,
    {
      hidden,
      presetId,
    },
  );
};

export const setPrivateModelHidden = async (
  hidden: boolean,
  modelId: string,
) => {
  return await client.request<{
    setPrivateModelHidden: API.GeneratePreset;
  }>(
    gql`
      mutation setPrivateModelHidden($hidden: Boolean!, $modelId: String!) {
        setPrivateModelHidden(hidden: $hidden, modelId: $modelId) {
          id
          hidden
        }
      }
    `,
    {
      hidden,
      modelId,
    },
  );
};

export const submitReviewForPrivateModel = async (
  modelId: string,
  price: API.PriceSettingsInput,
) => {
  return await client.request(
    gql`
      mutation submitReviewForPrivateModel(
        $modelId: String!
        $price: PriceSettingsInput!
      ) {
        submitReviewForPrivateModel(modelId: $modelId, price: $price) {
          id
        }
      }
    `,
    {
      modelId,
      price,
    },
  );
};

export const getAIWorkImage = async (id: string) => {
  return (
    await client.request<{ aiWorkImage: API.AiWorkImage }>(
      gql`
        query aiWorkImage($id: String!) {
          aiWorkImage(id: $id) {
            error
            hr {
              error
              id
              imageUrl
              imageUrls {
                origin
                small
                medium
              }
              progress
              status
            }
            id
            imageUrls {
              small
              medium
              origin
            }
            status
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
            personTemplate {
              id
            }
            progress
            usedMarketModels {
              id
              type
            }
          }
        }
      `,
      {
        id,
      },
    )
  ).aiWorkImage;
};

export const getAIWorkImages = async (page: number, pageSize: number) => {
  return await client.request<{
    aiWorkImages: API.AiWorkImage[];
    aiWorkImagesCount: number;
  }>(
    gql`
      query aiWorkImages($page: Float!, $pageSize: Float!) {
        aiWorkImages(page: $page, pageSize: $pageSize) {
          error
          hr {
            error
            id
            imageUrl
            imageUrls {
              origin
              small
              medium
            }
            progress
            status
          }
          id
          imageUrls {
            small
            medium
            origin
          }
          status
          progress
        }
        aiWorkImagesCount
      }
    `,
    {
      page,
      pageSize,
    },
  );
};

export const getInterrogate = async (id: string) => {
  return (
    await client.request<{ interrogate: API.Interrogate }>(
      gql`
        query interrogate($id: String!) {
          interrogate(id: $id) {
            completed
            failed
            id
            text
          }
        }
      `,
      { id },
    )
  ).interrogate;
};

export const getMyMarketPersonTemplates = async (
  page: number,
  pageSize: number,
) => {
  return (
    await client.request<{
      myMarketPersonTemplates: API.GeneratePreset[];
    }>(
      gql`
        query myMarketPersonTemplates($page: Float!, $pageSize: Float!) {
          myMarketPersonTemplates(page: $page, pageSize: $pageSize) {
            createTime
            catalogDetails {
              titleZh
              titleEn
            }
            createTime
            id
            displayImgUrl
            gender
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
      {
        page,
        pageSize,
      },
    )
  ).myMarketPersonTemplates;
};

export const publicMarketPersonTemplates = async (
  catalogs: string,
  gender: API.PresetGender,
  page: number,
  pageSize: number,
) => {
  return await client.request<{
    publicMarketPersonTemplates: API.GeneratePreset[];
    publicMarketPersonTemplatesCount: number;
  }>(
    gql`
      query publicMarketPersonTemplates(
        $catalogs: [String!]!
        $gender: PresetGender
        $page: Float!
        $pageSize: Float!
      ) {
        publicMarketPersonTemplates(
          catalogs: $catalogs
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
        publicMarketPersonTemplatesCount(catalogs: $catalogs, gender: $gender)
      }
    `,
    gender
      ? {
          catalogs,
          gender,
          page,
          pageSize,
        }
      : {
          catalogs,
          page,
          pageSize,
        },
  );
};

export const publicMarketPrivateModels = async (
  type: API.FineTuneType,
  page: number,
  pageSize: number,
) => {
  return await client.request<{
    publicMarketPrivateModels: API.FineTune[];
    publicMarketPrivateModelsCount: number;
  }>(
    gql`
      query publicMarketPrivateModels(
        $page: Float!
        $pageSize: Float!
        $type: FinetuneType
      ) {
        publicMarketPrivateModels(
          page: $page
          pageSize: $pageSize
          type: $type
        ) {
          id
          index {
            displayName
          }
          inputImages
          marketResource {
            free
            freeEnd
            id
            price
          }
          typeParams {
            ... on PersonTypeParams {
              gender
            }
          }
          uniqueToken
        }
        publicMarketPrivateModelsCount(type: $type)
      }
    `,
    { type, page, pageSize },
  );
};

export const createAiWorkImageHr = async (id: string) => {
  return await client.request(
    gql`
      mutation createAiWorkImageHr($id: String!) {
        createAiWorkImageHr(id: $id) {
          id
        }
      }
    `,
    { id },
  );
};

export const getAIWorkBaseModels = async () => {
  return (
    await client.request<{ aiWorkBaseModels: API.AiWorkBaseModel[] }>(gql`
      query aiWorkBaseModels {
        aiWorkBaseModels {
          baseModel
          description
          displayImage
          displayName
          id
        }
      }
    `)
  ).aiWorkBaseModels;
};
