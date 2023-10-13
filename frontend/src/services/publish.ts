import { client } from '@/services/index';
import { gql } from 'graphql-request';
export const prePublishSolanaNft = async (
  id: string,
  type: 'model' | 'template',
) => {
  return (
    await client.request<{ preSolanaPublishNft: API.SolanaPublish }>(
      gql`
        query preSolanaPublishNft($offLineId: String!, $publishType: String!) {
          preSolanaPublishNft(
            offLineId: $offLineId
            publishType: $publishType
          ) {
            name
            signature
            symbol
            uri
          }
        }
      `,
      { offLineId: id, publishType: type },
    )
  ).preSolanaPublishNft;
};
