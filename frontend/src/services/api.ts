import { client } from '@/services/index';
import { gql } from 'graphql-request';
import { Nft } from '@/models/nft';
import { Configure } from '@/constants';

export const getPoint = async (token: string) => {
  return await client.request<{
    selfPoints: {
      uid: string;
      points: number;
    };
  }>(
    gql`
      query points {
        selfPoints {
          uid
          points
        }
      }
    `,
    {},
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getSupportedNfts = async () => {
  return await client.request<{ supportedNfts: API.SupportedNft[] }>(gql`
    query supportedNfts {
      supportedNfts {
        enumerable
        name
        nft
      }
    }
  `);
};

export const getNftHasConvertChances = async (nft: string, tokenId: number) => {
  return await client.request<{ nftHasConvertChances: boolean }>(
    gql`
      query nftHasConvertChances($nft: String!, $tokenId: Int!) {
        nftHasConvertChances(nft: $nft, tokenId: $tokenId)
      }
    `,
    {
      nft,
      tokenId,
    },
  );
};

export const getPlaceholderNftHasConvertChances = async () => {
  return await client.request<{ placeholderNftHasConvertChances: boolean }>(
    gql`
      query placeholderNftHasConvertChances {
        placeholderNftHasConvertChances
      }
    `,
  );
};

export const createParallelTask = async ({
  fromPlaceholder = false,
  nft,
  tokenId,
}: {
  fromPlaceholder?: boolean;
  nft: string;
  tokenId: number;
}) => {
  return await client.request<{ createParallelTask: API.Task }>(
    gql`
      mutation createParallelTask(
        $fromPlaceholder: Boolean
        $nft: String!
        $tokenId: Int!
      ) {
        createParallelTask(
          fromPlaceholder: $fromPlaceholder
          nft: $nft
          tokenId: $tokenId
        ) {
          id
        }
      }
    `,
    { fromPlaceholder, nft, tokenId },
  );
};

export const getPurchaseContractAddress = async () => {
  return await client.request<{
    ethPurchaseContractAddress: string;
    neoPurchaseWalletAddress: string;
  }>(gql`
    query ethPurchaseContractAddress {
      ethPurchaseContractAddress
      neoPurchaseWalletAddress
    }
  `);
};

export const getPointsPrice = async (channel: API.PurchaseChannelId) => {
  return await client.request<{ pointsPrices: API.PointsPrice[] }>(
    gql`
      query pointsPrices($channel: PurchaseChannelId!) {
        pointsPrices(channel: $channel) {
          points
          price
          tempPoints
        }
      }
    `,
    { channel },
  );
};

export async function retrieveAssetsByOpensea(
  owner: string,
  contract: string,
  cursor: string = '',
): Promise<Nft[]> {
  const res = await fetch(
    `https://api.opensea.io/api/v1/assets?owner=${owner}&asset_contract_address=${contract}&limit=30${
      cursor ? `&cursor=${cursor}` : ''
    }`,
  );
  let { assets, next } = await res.json();
  assets = assets.map((e: any) => ({
    nft: contract,
    image: e.image_url,
    tokenId: parseInt(e.token_id),
    name: e.name,
  }));
  if (!next) {
    return assets;
  } else {
    const _assets = await retrieveAssetsByOpensea(owner, contract, next);
    return assets.concat(_assets);
  }
}

export const applySupport = async (
  type: string,
  serializedData: string,
  token: string,
) => {
  return await client.request(
    gql`
      mutation applySupport($type: String!, $serializedData: String!) {
        applySupport(type: $type, serializedData: $serializedData)
      }
    `,
    { type, serializedData },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getPublications = async (
  page: number,
  pageSize: number,
  type?: API.PublicationType,
) => {
  return await client.request<{ publications: API.Publication[] }>(
    gql`
      query publications($page: Int!, $pageSize: Int!, $type: PublicationType) {
        publications(page: $page, pageSize: $pageSize, type: $type) {
          id
          image
          task {
            creator
            id
            info {
              ... on CreativeInfo {
                artStyle
                images
                inputImage
                creativeModel: model
                prompt
                promptStrength
                ratio
                type
              }
              ... on CustomizedInfo {
                customizedModel: model
                prompt
              }
              ... on ParallelInfo {
                nft
                tokenId
              }
            }
            progress
            status
            type
          }
          publisher
          type
        }
      }
    `,
    { page, pageSize, type },
  );
};

export const getCollections = async (
  page: number,
  pageSize: number,
  type: API.CollectionType | undefined,
  token: string,
) => {
  return await client.request<{ collections: API.CollectionsItem[] }>(
    gql`
      query collections(
        $onlyFinished: Boolean = true
        $page: Int!
        $pageSize: Int!
        $type: CollectionsType
      ) {
        collections(
          onlyFinished: $onlyFinished
          page: $page
          pageSize: $pageSize
          type: $type
        ) {
          creator
          id
          image
          task {
            creator
            id
            info {
              ... on CreativeInfo {
                artStyle
                images
                inputImage
                creativeModel: model
                prompt
                promptStrength
                ratio
                type
              }
              ... on CustomizedInfo {
                customizedModel: model
                prompt
              }
              ... on ParallelInfo {
                nft
                tokenId
              }
            }
            progress
            status
            type
          }
          published
          shared
          type
        }
      }
    `,
    { page, pageSize, type },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getCollection = async (itemId: string, token: string) => {
  return await client.request<{ myCollectionItem: API.CollectionsItem }>(
    gql`
      query myCollectionItem($itemId: String!) {
        myCollectionItem(itemId: $itemId) {
          creator
          id
          image
          task {
            creator
            id
            info {
              ... on CreativeInfo {
                artStyle
                images
                inputImage
                creativeModel: model
                prompt
                promptStrength
                ratio
                type
              }
              ... on CustomizedInfo {
                customizedModel: model
                prompt
              }
              ... on ParallelInfo {
                nft
                tokenId
              }
            }
            progress
            status
            type
          }
          published
          shared
          type
        }
      }
    `,
    { itemId },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const publishCollectionsItem = async (itemId: string, token: string) => {
  return await client.request(
    gql`
      mutation publishCollectionsItem($itemId: String!) {
        publishCollectionsItem(itemId: $itemId) {
          id
        }
      }
    `,
    {
      itemId,
    },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const setCollectionsItemShared = async (
  itemId: string,
  token: string,
) => {
  return await client.request(
    gql`
      mutation setCollectionsItemShared($itemId: String!) {
        setCollectionsItemShared(itemId: $itemId) {
          id
        }
      }
    `,
    { itemId },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const deleteCollectionItem = async (itemId: string, token: string) => {
  return await client.request(
    gql`
      mutation deleteCollectionsItem($itemId: String!) {
        deleteCollectionsItem(itemId: $itemId)
      }
    `,
    { itemId },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const createCreationTask = async (
  params: {
    model: string;
    prompt: string;
  },
  token: string,
) => {
  return await client.request<{ createCreativeTask: API.Task }>(
    gql`
      mutation createCreativeTask(
        $images: Int!
        $lang: AigcSupportedLang
        $model: CreativeEngineId!
        $prompt: String!
        $ratio: Ratio
      ) {
        createCreativeTask(
          images: $images
          model: $model
          prompt: $prompt
          lang: $lang
          ratio: $ratio
        ) {
          id
          status
        }
      }
    `,
    { ...params, lang: Configure.promptLocale, images: 1 },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const createCreativeTaskFromAct = async (params: {
  actId: string;
  prompt: string;
  artStyle?: API.ArtStyle;
  promptStrength?: number;
}) => {
  return await client.request<{ createCreativeTaskFromAct: API.Task }>(
    gql`
      mutation createCreativeTaskFromAct(
        $actId: String!
        $artStyle: ArtStyle
        $lang: AigcSupportedLang
        $prompt: String!
        $promptStrength: Float
      ) {
        createCreativeTaskFromAct(
          actId: $actId
          artStyle: $artStyle
          lang: $lang
          prompt: $prompt
          promptStrength: $promptStrength
        ) {
          id
          status
        }
      }
    `,
    { ...params, lang: Configure.promptLocale },
  );
};

export const createCreationTaskAdvanced = async (
  params: {
    model: string;
    prompt: string;
    images: number;
    ratio?: string;
    artStyle?: API.ArtStyle;
    inputImage?: string;
    promptStrength?: number;
    negativePrompt?: string;
  },
  token: string,
) => {
  return await client.request<{ createCreativeAdvancedTask: API.Task }>(
    gql`
      mutation createCreativeAdvancedTask(
        $artStyle: ArtStyle
        $images: Int!
        $inputImage: String
        $lang: AigcSupportedLang
        $model: CreativeEngineId!
        $negativePrompt: String
        $prompt: String!
        $promptStrength: Float
        $ratio: Ratio
      ) {
        createCreativeAdvancedTask(
          artStyle: $artStyle
          images: $images
          inputImage: $inputImage
          lang: $lang
          model: $model
          negativePrompt: $negativePrompt
          prompt: $prompt
          promptStrength: $promptStrength
          ratio: $ratio
        ) {
          id
          status
        }
      }
    `,
    { ...params, lang: Configure.promptLocale },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getTask = async (id: string, token: string) => {
  return client.request<{ task: API.Task }>(
    gql`
      query task($id: String!) {
        task(id: $id) {
          creator
          id
          error
          info {
            ... on CreativeInfo {
              artStyle
              images
              inputImage
              creativeModel: model
              prompt
              promptStrength
              ratio
              type
            }
            ... on CustomizedInfo {
              customizedModel: model
              prompt
            }
            ... on ParallelInfo {
              nft
              tokenId
            }
          }
          progress
          status
          type
          outputs {
            creator
            id
            image
            imageUrls {
              small
              medium
              origin
            }
            published
            shared
            type
          }
        }
      }
    `,
    { id },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getTasks = async (
  page: number,
  pageSize: number,
  type: API.PublicationType | undefined,
  token: string,
) => {
  return client.request<{ tasks: API.Task[] }>(
    gql`
      query tasks($page: Int!, $pageSize: Int!, $type: TaskType) {
        tasks(page: $page, pageSize: $pageSize, type: $type) {
          creator
          id
          error
          info {
            ... on CreativeInfo {
              artStyle
              images
              inputImage
              creativeModel: model
              prompt
              promptStrength
              ratio
              type
            }
            ... on CustomizedInfo {
              customizedModel: model
              prompt
            }
            ... on ParallelInfo {
              nft
              tokenId
            }
          }
          progress
          status
          type
          outputs {
            creator
            id
            image
            published
            shared
            type
          }
        }
      }
    `,
    { page, pageSize, type },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getParallelTaskMetadata = async (token: string) => {
  return client.request<{ parallelTaskMetadata: API.ParallelTaskMetadata }>(
    gql`
      query parallelTaskMetadata {
        parallelTaskMetadata {
          hasEverShared
          perOutputCost
          placeHolderNft
          placeHolderNftTokenId
          publishAwardedPoints
          restFreeTimes
          shareAwardedPoints
          shareAwardedPointsFirstTime
        }
      }
    `,
    {},
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getCreativeTaskMetadata = async (token: string) => {
  return client.request<{ creativeTaskMetadata: API.CreativeTaskMetadata }>(
    gql`
      query creativeTaskMetadata {
        creativeTaskMetadata {
          advancedFeaturesEnabled
          hasEverShared
          perOutputCost
          publishAwardedPoints
          restFreeTimes
          shareAwardedPoints
          shareAwardedPointsFirstTime
        }
      }
    `,
    {},
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getCustomTaskMetadata = async (token: string) => {
  return client.request<{ customTaskMetadata: API.CustomTaskMetadata }>(
    gql`
      query customTaskMetadata {
        customTaskMetadata {
          hasEverShared
          perOutputCost
          publishAwardedPoints
          restFreeTimes
          shareAwardedPoints
          shareAwardedPointsFirstTime
        }
      }
    `,
    {},
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const publishOutput = async (id: string, token: string) => {
  return client.request(
    gql`
      mutation publishOutput($id: String!) {
        publishOutput(id: $id) {
          id
        }
      }
    `,
    { id },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const deleteOutput = async (id: string, token: string) => {
  return client.request(
    gql`
      mutation deleteOutput($id: String!) {
        deleteOutput(id: $id)
      }
    `,
    { id },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const setOutputShared = async (id: string, token: string) => {
  return client.request(
    gql`
      mutation setOutputShared($id: String!) {
        setOutputShared(id: $id) {
          id
        }
      }
    `,
    { id },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const createCustomTask = async (
  model: API.CustomizedModel,
  prompt: string,
  token: string,
) => {
  return client.request<{ createCustomizedTask: API.Task }>(
    gql`
      mutation createCustomizedTask(
        $model: CustomizedModel!
        $prompt: String!
        $lang: AigcSupportedLang
      ) {
        createCustomizedTask(model: $model, prompt: $prompt, lang: $lang) {
          id
          status
        }
      }
    `,
    { model, prompt, lang: Configure.promptLocale },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getOutput = async (id: string, token: string) => {
  return client.request<{ output: API.Output }>(
    gql`
      query output($id: String!) {
        output(id: $id) {
          creator
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
          published
          shared
          submission {
            activity {
              id
              coverImgUrl
              name
              status
              rule
            }
            id
            votes
          }
          task {
            creator
            error
            id
            info {
              ... on CreativeInfo {
                artStyle
                images
                inputImage
                creativeModel: model
                prompt
                promptStrength
                ratio
                type
              }
              ... on CustomizedInfo {
                customizedModel: model
                prompt
              }
              ... on ParallelInfo {
                nft
                tokenId
              }
            }
            progress
            status
            type
          }
          type
        }
      }
    `,
    { id },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getOutputs = async (
  params: {
    onlyFinished: boolean;
    page: number;
    pageSize: number;
    type?: API.TaskType;
  },
  token: string,
) => {
  return client.request<{ outputs: API.Output[]; totalOutputs: number }>(
    gql`
      query outputs(
        $onlyFinished: Boolean
        $page: Int!
        $pageSize: Int!
        $type: TaskType
      ) {
        outputs(
          onlyFinished: $onlyFinished
          page: $page
          pageSize: $pageSize
          type: $type
        ) {
          creator
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
          published
          shared
          submission {
            activity {
              id
              coverImgUrl
              name
              status
              rule
            }
            id
            votes
          }
          task {
            creator
            error
            id
            info {
              ... on CreativeInfo {
                artStyle
                images
                inputImage
                creativeModel: model
                prompt
                promptStrength
                ratio
                type
              }
              ... on CustomizedInfo {
                customizedModel: model
                prompt
              }
              ... on ParallelInfo {
                nft
                tokenId
              }
            }
            progress
            status
            type
          }
          type
        }
        totalOutputs(type: $type)
      }
    `,
    { ...params },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getCurrentUser = async (token: string) => {
  return client.request<{ currentUser: API.User }>(
    gql`
      query currentUser {
        currentUser {
          avatarUrl
          eth {
            address
            wallet
          }
          id
          neo {
            publicKey
            wallet
          }
          solana {
            address
            publicKey
            wallet
          }
          twitter {
            id
            name
            profileImageUrl
            username
          }
          google {
            email
            firstName
            lastName
            picture
          }
          username
        }
      }
    `,
    {},
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const bindAccount = async (
  bindType: 'eth' | 'neo',
  message: string,
  address: string,
  wallet: string,
  signature: string,
  token: string,
) => {
  if (bindType === 'eth') {
    return client.request(
      gql`
        mutation bindEthAccount(
          $address: String!
          $message: String!
          $sig: String!
          $wallet: String!
        ) {
          bindEthAccount(
            address: $address
            message: $message
            sig: $sig
            wallet: $wallet
          ) {
            address
            wallet
          }
        }
      `,
      { address, message, sig: signature, wallet },
      {
        authorization: `Bearer ${token}`,
      },
    );
  } else if (bindType === 'neo') {
    const { publicKey, signature: _signature } = JSON.parse(signature);
    return client.request(
      gql`
        mutation bindNeoAccount(
          $message: String!
          $publicKey: String!
          $sig: String!
          $wallet: String!
        ) {
          bindNeoAccount(
            message: $message
            publicKey: $publicKey
            sig: $sig
            wallet: $wallet
          ) {
            publicKey
            wallet
          }
        }
      `,
      { sig: _signature, message, publicKey, wallet },
      {
        authorization: `Bearer ${token}`,
      },
    );
  }
};

export const unbindAccount = async (bindType: 'eth' | 'neo') => {
  if (bindType === 'eth') {
    return client.request(gql`
      mutation unbindEthAccount {
        unbindEthAccount
      }
    `);
  } else if (bindType === 'neo') {
    return client.request(gql`
      mutation unbindNeoAccount {
        unbindNeoAccount
      }
    `);
  }
};

export const getActivity = async (id: string) => {
  return client.request<{ activity: API.Activity[] }>(
    gql`
      query activity($id: String!) {
        activity(id: $id) {
          coverImgUrl
          id
          name
          planFinishAt
          planStartAt
          rule
          status
        }
      }
    `,
    {
      id,
    },
  );
};

export const getActivityUserStatus = async (id: string, token: string) => {
  return client.request<{ activityUserStatus: API.ActivityUserStatus }>(
    gql`
      query activityUserStatus($id: String!) {
        activityUserStatus(id: $id) {
          activity {
            id
            coverImgUrl
            name
          }
          id
          restSubmitChances
          restVoteChances
          unlimited
        }
      }
    `,
    {
      id,
    },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getActivities = async (status?: API.ActivityStatus) => {
  return client.request<{ activities: API.Activity[] }>(
    gql`
      query activities($statusIn: [ActivityStatus!]) {
        activities(statusIn: $statusIn) {
          coverImgUrl
          id
          name
          planFinishAt
          planStartAt
          rule
          status
        }
      }
    `,
    {
      statusIn: status ? [status] : undefined,
    },
  );
};

export const getActivitiesUserStatus = async (
  contentId: string,
  contentType: API.ActivityContentType,
  status?: API.ActivityStatus,
) => {
  return client.request<{ activitiesUserStatus: API.ActivityUserStatus[] }>(
    gql`
      query activitiesUserStatus(
        $statusIn: [ActivityStatus!]
        $contentId: String!
        $contentType: ActivityContentType!
      ) {
        activitiesUserStatus(statusIn: $statusIn) {
          activity {
            id
            isContentAvailable(contentType: $contentType, contentId: $contentId)
            coverImgUrl
            name
          }
          id
          restSubmitChances
          restVoteChances
          unlimited
        }
      }
    `,
    { contentId, contentType, statusIn: status ? [status] : [] },
  );
};

export const getActivitySubmission = async (id: string) => {
  return client.request<{ activitySubmission: API.ActivitySubmission }>(
    gql`
      query activitySubmission($id: String!) {
        activitySubmission(id: $id) {
          activity {
            coverImgUrl
            id
            name
            status
          }
          content {
            contentId
            contentType
            pubInfo {
              ... on ActivityContentPublicInfoOutput {
                contentType
                image
              }
            }
            used
          }
          createTime
          id
          publisher
          uid
          votes
        }
      }
    `,
    { id },
  );
};

export const getActivitySubmissionVote = async (id: string) => {
  const { activitySubmission } = await client.request<{
    activitySubmission: { votes: number };
  }>(
    gql`
      query activitySubmission($id: String!) {
        activitySubmission(id: $id) {
          id
          votes
        }
      }
    `,
    { id },
  );
  return activitySubmission.votes;
};

export const getActivitySubmissions = async (
  actId: string,
  page: number,
  pageSize: number,
  order: API.SubmissionOrder,
  orderBy: API.SubmissionOrderBy,
) => {
  return client.request<{ activitySubmissions: API.ActivitySubmission[] }>(
    gql`
      query activitySubmissions(
        $actId: String!
        $order: SubmissionOrder!
        $orderBy: SubmissionOrderBy!
        $page: Int!
        $pageSize: Int!
      ) {
        activitySubmissions(
          actId: $actId
          order: $order
          orderBy: $orderBy
          page: $page
          pageSize: $pageSize
        ) {
          activity {
            coverImgUrl
            id
            name
            status
          }
          content {
            contentId
            contentType
            pubInfo {
              ... on ActivityContentPublicInfoOutput {
                contentType
                image
              }
            }
            used
          }
          createTime
          id
          publisher
          uid
          votes
        }
      }
    `,
    { page, pageSize, order, orderBy, actId },
  );
};

export const submitActivity = async (
  actId: string,
  contentId: string,
  contentType: API.ActivityContentType,
  token: string,
) => {
  return client.request(
    gql`
      mutation createActivitySubmission(
        $actId: String!
        $contentId: String!
        $contentType: ActivityContentType!
      ) {
        createActivitySubmission(
          actId: $actId
          contentId: $contentId
          contentType: $contentType
        ) {
          id
        }
      }
    `,
    { actId, contentId, contentType },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const voteSubmission = async (submissionId: string, token: string) => {
  return client.request(
    gql`
      mutation createActivityVote($submissionId: String!) {
        createActivityVote(submissionId: $submissionId)
      }
    `,
    { submissionId },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getActivityAvailableContents = async (
  actId: string,
  page: number,
  pageSize: number,
  includeUsed: boolean,
  token: string,
) => {
  return client.request<{
    activityAvailableContents: API.ActivityContent[];
    totalActivityAvailableContents: number;
  }>(
    gql`
      query activityAvailableContents(
        $actId: String!
        $includeUsed: Boolean!
        $page: Int!
        $pageSize: Int!
      ) {
        activityAvailableContents(
          actId: $actId
          includeUsed: $includeUsed
          page: $page
          pageSize: $pageSize
        ) {
          contentId
          contentType
          details {
            ... on ActivityContentDetailsOutput {
              output {
                id
                image
                imageUrls {
                  small
                  medium
                  origin
                }
                published
                task {
                  creator
                  error
                  id
                  info {
                    ... on CreativeInfo {
                      artStyle
                      images
                      inputImage
                      creativeModel: model
                      prompt
                      promptStrength
                      ratio
                      type
                    }
                    ... on CustomizedInfo {
                      customizedModel: model
                      prompt
                    }
                    ... on ParallelInfo {
                      nft
                      tokenId
                    }
                  }
                  progress
                  status
                  type
                }
                type
              }
            }
          }
          pubInfo {
            ... on ActivityContentPublicInfoOutput {
              contentType
              image
            }
          }
          used
        }
        totalActivityAvailableContents(actId: $actId, includeUsed: $includeUsed)
      }
    `,
    { actId, page, pageSize, includeUsed },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getActivityContent = async (
  contentId: string,
  contentType: API.ActivityContentType,
) => {
  return client.request<{ activityContent: API.ActivityContent }>(
    gql`
      query activityContent(
        $contentId: String!
        $contentType: ActivityContentType!
      ) {
        activityContent(contentId: $contentId, contentType: $contentType) {
          contentId
          contentType
          details {
            ... on ActivityContentDetailsOutput {
              output {
                id
                image
                imageUrls {
                  small
                  medium
                  origin
                }
                published
                type
              }
            }
          }
          pubInfo {
            ... on ActivityContentPublicInfoOutput {
              contentType
              image
            }
          }
          used
        }
      }
    `,
    {
      contentId,
      contentType,
    },
  );
};

export const getVotedActivitySubmissions = async (
  actId: string,
  order: API.SubmissionOrder,
  orderBy: API.SubmissionOrderBy,
  page: number,
  pageSize: number,
  token: string,
) => {
  return client.request(
    gql`
      query votedActivitySubmissions(
        $actId: String!
        $order: SubmissionOrder!
        $orderBy: SubmissionOrderBy!
        $page: Int!
        $pageSize: Int!
      ) {
        votedActivitySubmissions(
          actId: $actId
          order: $order
          orderBy: $orderBy
          page: $page
          pageSize: $pageSize
        ) {
          activity {
            coverImgUrl
            id
            name
            status
          }
          content {
            contentId
            contentType
            pubInfo {
              ... on ActivityContentPublicInfoOutput {
                contentType
                image
              }
            }
            used
          }
          createTime
          id
          publisher
          uid
          votes
        }
      }
    `,
    { actId, order, orderBy, page, pageSize },
    {
      authorization: `Bearer ${token}`,
    },
  );
};

export const getAvailableVotesForSubmission = async (submissionId: string) => {
  return client.request<{ availableVotesForSubmission: number }>(
    gql`
      query availableVotesForSubmission($submissionId: String!) {
        availableVotesForSubmission(submissionId: $submissionId)
      }
    `,
    { submissionId },
  );
};

export const getWechatOrderStatus = async (id: string) => {
  return client.request<{ billWechatOrder: API.BillWechatOrder }>(
    gql`
      query billWechatOrder($id: String!) {
        billWechatOrder(id: $id) {
          id
          source
          status
          uid
        }
      }
    `,
    { id },
  );
};

export const createWechatPayOrder = async (price: number) => {
  return client.request<{
    createWechatPayOrderWeb: API.BillWechatOrderWebPayinfo;
  }>(
    gql`
      query createWechatPayOrderWeb($price: Float!) {
        createWechatPayOrderWeb(price: $price) {
          orderId
          payUrl
        }
      }
    `,
    { price },
  );
};

export const getPublicationByOutputId = async (outputId: string) => {
  return client.request<{ outputPublication?: API.Publication }>(
    gql`
      query outputPublication($outputId: String!) {
        outputPublication(outputId: $outputId) {
          id
        }
      }
    `,
    { outputId },
  );
};

export const getSubmissionIdByOutputId = async (id: string) => {
  const { output } = await client.request<{ output: API.Output }>(
    gql`
      query output($id: String!) {
        output(id: $id) {
          submission {
            id
          }
        }
      }
    `,
    { id },
  );
  return output.submission?.id;
};

export const createAigcOutputHr = async (id: string) => {
  return client.request<{ createAigcOutputHr: API.HrTask }>(
    gql`
      mutation createAigcOutputHr($id: String!) {
        createAigcOutputHr(id: $id) {
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

export const updateWechatInfo = async (name: string, avatar: string) => {
  return client.request<{ updateWechatInfo: API.UserBasicInfo }>(
    gql`
      mutation updateWechatInfo($input: UpdateUserWechatInput!) {
        updateWechatInfo(input: $input) {
          id
        }
      }
    `,
    {
      input: {
        nickname: name,
        headimgurl: avatar,
      },
    },
  );
};

export const loginBySignature = async (params: {
  signature: string;
  message: string;
  pubkey: string;
  account: string;
  wallet: string;
}) => {
  return (
    await client.request<{ loginBySignature: API.Jwt }>(
      gql`
        query loginBySignature(
          $account: String!
          $message: String!
          $pubkey: String!
          $signature: String!
          $wallet: String!
        ) {
          loginBySignature(
            account: $account
            message: $message
            pubkey: $pubkey
            signature: $signature
            wallet: $wallet
          ) {
            expireAt
            token
          }
        }
      `,
      params,
    )
  ).loginBySignature;
};

export const loginBySolanaSignature = async (params: {
  signature: string;
  message: string;
  pubkey: string;
  account: string;
  wallet: string;
}) => {
  return (
    await client.request<{ loginBySolanaSignature: API.Jwt }>(
      gql`
        query loginBySolanaSignature(
          $account: String!
          $message: String!
          $pubkey: String!
          $signature: String!
          $wallet: String!
        ) {
          loginBySolanaSignature(
            account: $account
            message: $message
            pubkey: $pubkey
            signature: $signature
            wallet: $wallet
          ) {
            expireAt
            token
          }
        }
      `,
      params,
    )
  ).loginBySolanaSignature;
};
