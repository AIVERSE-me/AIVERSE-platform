import { client } from '@/services/index';
import { gql } from 'graphql-request';

type CreateStyleFineTuneInput = {
  inputImages: string[];
  tech: API.FineTuneTech;
  token: string;
};

type CreatePersonFineTuneInput = {
  gender: API.FineTuneGender;
  inputImages: string[];
  tech: API.FineTuneTech;
  token: string;
};

export const getFineTune = async (id: string) => {
  return client.request<{ finetune: API.FineTune }>(
    gql`
      query finetune($id: String!) {
        finetune(id: $id) {
          createTime
          creator
          error
          id
          index {
            displayName
            published
          }
          inputImages
          marketResource {
            published
            reviewStatus
            reviewReason
            id
            hidden
          }
          marketUsage {
            owner
            resId
            resType
            summary {
              count
              prices
            }
          }
          progress
          status
          tech
          token
          type
          typeParams {
            ... on PersonTypeParams {
              gender
            }
          }
          uniqueToken
          updateTime
        }
      }
    `,
    { id },
  );
};

export const getFineTuneOutput = async (id: string) => {
  return client.request<{ finetuneOutput: API.FineTuneOutput }>(
    gql`
      query finetuneOutput($id: String!) {
        finetuneOutput(id: $id) {
          createTime
          creator
          error
          hr {
            error
            id
            imageUrl
            progress
            status
          }
          id
          image
          imageUrls {
            small
            medium
            origin
          }
          progress
          prompt
          status
          updateTime
          usedFinetuneId
        }
      }
    `,
    { id },
  );
};

export const getFineTuneOutputs = async (
  finetuneId: string,
  pageSize: number,
) => {
  return client.request<{ finetuneOutputs: API.FineTuneOutput[] }>(
    gql`
      query finetuneOutputs($finetuneId: String!, $pageSize: Float!) {
        finetuneOutputs(finetuneId: $finetuneId, pageSize: $pageSize) {
          error
          hr {
            error
            id
            imageUrl
            progress
            status
          }
          id
          image
          imageUrls {
            small
            medium
            origin
          }
          progress
          prompt
          status
        }
      }
    `,
    { finetuneId, pageSize },
  );
};

export const hasFineTune = async () => {
  const { finetunes } = await client.request<{ finetunes: API.FineTune[] }>(
    gql`
      query finetunes {
        finetunes {
          id
        }
      }
    `,
  );
  return finetunes?.[0];
};

export const hasFineTuneInTraining = async () => {
  const { finetunes } = await client.request<{ finetunes: API.FineTune[] }>(
    gql`
      query finetunes {
        finetunes {
          id
          status
        }
      }
    `,
  );
  return finetunes
    ? finetunes.some((f) => f.status === 'STARTED' || f.status === 'CREATED')
    : false;
};

export const getFineTunes = async (type?: API.FineTuneType) => {
  return client.request<{ finetunes: API.FineTune[] }>(
    gql`
      query finetunes($type: FinetuneType) {
        finetunes(type: $type) {
          createTime
          creator
          error
          id
          index {
            displayName
            published
          }
          inputImages
          marketResource {
            published
            reviewStatus
            reviewReason
            id
            hidden
          }
          marketUsage {
            owner
            resId
            resType
            summary {
              count
              prices
            }
          }
          progress
          status
          tech
          token
          type
          typeParams {
            ... on PersonTypeParams {
              gender
            }
          }
          uniqueToken
          updateTime
        }
      }
    `,
    { type },
  );
};

export const createPersonFineTune = async (
  input: Omit<CreatePersonFineTuneInput, 'tech'>,
) => {
  return client.request<{ createPersonFinetune: API.FineTune }>(
    gql`
      mutation createPersonFinetune($input: CreatePersonFinetuneInput!) {
        createPersonFinetune(input: $input) {
          createTime
          creator
          error
          id
          index {
            displayName
            published
          }
          inputImages
          progress
          status
          tech
          token
          type
          typeParams {
            ... on PersonTypeParams {
              gender
            }
          }
          uniqueToken
          updateTime
        }
      }
    `,
    {
      input: {
        ...input,
        tech: 'LORA',
      },
    },
  );
};

export const createStyleFineTune = async (
  input: Omit<CreateStyleFineTuneInput, 'tech'>,
) => {
  return client.request<{ createStyleFinetune: API.FineTune }>(
    gql`
      mutation createStyleFinetune($input: CreateStyleFinetuneInput!) {
        createStyleFinetune(input: $input) {
          createTime
          creator
          error
          id
          index {
            displayName
            published
          }
          inputImages
          progress
          status
          tech
          token
          type
          updateTime
        }
      }
    `,
    {
      input: {
        ...input,
        tech: 'TEXTUAL_INVERSION',
      },
    },
  );
};

export const createFineTuneOutputUsePreset = async (
  finetuneId: string,
  presetId: string,
  overridePrompt?: string,
) => {
  return client.request<{
    createFinetuneOutputUsePreset: API.FineTuneOutput;
  }>(
    gql`
      mutation createFinetuneOutputUsePreset(
        $finetuneId: String!
        $overridePrompt: String
        $presetId: String!
      ) {
        createFinetuneOutputUsePreset(
          finetuneId: $finetuneId
          overridePrompt: $overridePrompt
          presetId: $presetId
        ) {
          createTime
          creator
          error
          id
          image
          imageUrls {
            small
            medium
            origin
          }
          progress
          prompt
          status
          token
          updateTime
          usedFinetuneId
        }
      }
    `,
    { finetuneId, presetId, overridePrompt },
  );
};

export const updateFineTuneIndex = async (
  displayName: string,
  id: string,
  published: boolean,
) => {
  return client.request<{ updateFinetuneIndex: API.FineTuneIndex }>(
    gql`
      mutation updateFinetuneIndex(
        $displayName: String!
        $id: String!
        $published: Boolean!
      ) {
        updateFinetuneIndex(
          displayName: $displayName
          id: $id
          published: $published
        ) {
          displayName
          published
        }
      }
    `,
    { displayName, id, published },
  );
};

export const createFineTuneImageDetectionTasks = async (assetIds: string[]) => {
  return client.request<{
    createImageDetectionTasks: API.ImageDetectionTask[];
  }>(
    gql`
      mutation createImageDetectionTasks($assetIds: [String!]!) {
        createImageDetectionTasks(assetIds: $assetIds) {
          assetId
          createTime
          id
          result
          status
        }
      }
    `,
    { assetIds },
  );
};

export const getFineTuneImageDetectionTasks = async (assetIds: string[]) => {
  return client.request<{
    queryImageDetectionTasks: API.ImageDetectionTask[];
  }>(
    gql`
      query queryImageDetectionTasks($assetIds: [String!]!) {
        queryImageDetectionTasks(assetIds: $assetIds) {
          assetId
          createTime
          id
          result
          status
        }
      }
    `,
    { assetIds },
  );
};

export const getPreviousFineTuneJobsCount = (finetuneId: string) => {
  return client.request<{ previousFinetuneJobsCount: number }>(
    gql`
      query previousFinetuneJobsCount($finetuneId: String!) {
        previousFinetuneJobsCount(finetuneId: $finetuneId)
      }
    `,
    {
      finetuneId,
    },
  );
};

export const hasProgressingFineTuneOutputs = async (finetuneId?: string) => {
  const { progressingFinetuneOutputs } = await client.request<{
    progressingFinetuneOutputs: API.FineTuneOutput[];
  }>(
    gql`
      query progressingFinetuneOutputs($finetuneId: String) {
        progressingFinetuneOutputs(finetuneId: $finetuneId) {
          id
        }
      }
    `,
    { finetuneId },
  );
  return progressingFinetuneOutputs.length > 0;
};

export const getFineTunePresetCatalogs = async () => {
  return (
    await client.request<{
      generatePresetCatalogs: API.GeneratePresetCatalog[];
    }>(gql`
      query generatePresetCatalogs {
        generatePresetCatalogs {
          id
          titleEn
          titleZh
        }
      }
    `)
  ).generatePresetCatalogs;
};

export const deleteFineTuneOutput = async (id: string) => {
  return await client.request<string>(
    gql`
      mutation deleteFinetuneOutput($id: String!) {
        deleteFinetuneOutput(id: $id)
      }
    `,
    {
      id,
    },
  );
};

export const createFineTuneOutputHr = async (id: string) => {
  return client.request<{ createFinetuneOutputHr: API.HrTask }>(
    gql`
      mutation createFinetuneOutputHr($id: String!) {
        createFinetuneOutputHr(id: $id) {
          error
          id
          imageUrl
          progress
          status
        }
      }
    `,
    { id },
  );
};

export const getFineTunesByUniqueTokens = async (uniqueTokens: string[]) => {
  return (
    await client.request<{ finetunesByUniqueTokens: (API.FineTune | null)[] }>(
      gql`
        query finetunesByUniqueTokens($uniqueTokens: [String!]!) {
          finetunesByUniqueTokens(uniqueTokens: $uniqueTokens) {
            creator
            id
            marketResource {
              free
              price
              hidden
              id
              published
              freeEnd
            }
            status
            type
          }
        }
      `,
      { uniqueTokens },
    )
  ).finetunesByUniqueTokens;
};
