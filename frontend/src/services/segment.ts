import { client } from '@/services/index';
import { gql } from 'graphql-request';

export const createSegmentTask = async (asset: string, note: string) => {
  return client.request<{ createSegmentTask: API.SegmentTask }>(
    gql`
      mutation createSegmentTask($asset: String!, $note: String!) {
        createSegmentTask(asset: $asset, note: $note) {
          asset
          createTime
          error
          id
          layers {
            bbox_h
            bbox_w
            bbox_x0
            bbox_y0
            id
          }
          note
          status
        }
      }
    `,
    { asset, note },
  );
};

export const getRunningSegmentTasks = async () => {
  return await client.request<{
    runningSegmentTasks: API.SegmentTask[];
  }>(gql`
    query runningSegmentTasks {
      runningSegmentTasks {
        createTime
        id
        note
        status
      }
    }
  `);
};

export const getSegmentTask = async (id: string) => {
  return client.request<{ segmentTask: API.SegmentTask }>(
    gql`
      query segmentTask($id: String!) {
        segmentTask(id: $id) {
          asset
          createTime
          error
          id
          layers {
            bbox_h
            bbox_w
            bbox_x0
            bbox_y0
            id
          }
          note
          status
        }
      }
    `,
    { id },
  );
};

export const getSegmentTaskByAsset = async (asset: string) => {
  return client.request<{ segmentTaskByAsset?: API.SegmentTask }>(
    gql`
      query segmentTaskByAsset($asset: String!) {
        segmentTaskByAsset(asset: $asset) {
          asset
          createTime
          error
          id
          layers {
            bbox_h
            bbox_w
            bbox_x0
            bbox_y0
            id
          }
          note
          status
        }
      }
    `,
    { asset },
  );
};
