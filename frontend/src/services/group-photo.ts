import { client } from '@/services/index';
import { gql } from 'graphql-request';

export const createGroupPhotoTask = async (templateId: string) => {
  return (
    await client.request<{ createGroupPhotoTask: API.GroupPhotoTask }>(
      gql`
        mutation createGroupPhotoTask($templateId: String!) {
          createGroupPhotoTask(templateId: $templateId) {
            createTime
            creatorId
            hr {
              id
              imageUrls {
                origin
                small
                medium
              }
              progress
              status
            }
            id
            members {
              finetuneId
              finetuneInputImages {
                small
              }
              position
              progress
              status
              userinfo {
                avatarUrl
                id
                username
              }
            }
            reason
            result {
              small
              medium
              origin
            }
            status
            template {
              catalog {
                name
              }
              displayImg
              positionImg
              positions {
                position
              }
            }
          }
        }
      `,
      { templateId },
    )
  ).createGroupPhotoTask;
};

export const createGroupPhotoTaskHr = async (id: string) => {
  return (
    await client.request<{ createGroupPhotoTaskHr: API.HrTask }>(
      gql`
        mutation createGroupPhotoTaskHr($id: String!) {
          createGroupPhotoTaskHr(id: $id) {
            id
          }
        }
      `,
      { id },
    )
  ).createGroupPhotoTaskHr;
};

export const cancelGroupPhotoTask = async (id: string) => {
  return client.request(
    gql`
      mutation cancelGroupPhotoTask($id: String!) {
        cancelGroupPhotoTask(id: $id) {
          id
        }
      }
    `,
    { id },
  );
};

export const removeGroupPhotoTask = async (id: string) => {
  return client.request(
    gql`
      mutation removeGroupPhotoTask($id: String!) {
        removeGroupPhotoTask(id: $id)
      }
    `,
    { id },
  );
};

export const setGroupPhotoTaskMember = async (
  fineTuneId: string,
  position: number,
  taskId: string,
) => {
  return client.request<{
    setGroupPhotoTaskMember: API.GroupPhotoTaskMemberModel;
  }>(
    gql`
      mutation setGroupPhotoTaskMember(
        $finetuneId: String!
        $position: Float!
        $taskId: String!
      ) {
        setGroupPhotoTaskMember(
          finetuneId: $finetuneId
          position: $position
          taskId: $taskId
        ) {
          userId
        }
      }
    `,
    { finetuneId: fineTuneId, position, taskId },
  );
};

export const getGroupPhotoCatalogs = async () => {
  return (
    await client.request<{
      groupPhotoCatalogs: API.GroupPhotoCatalog[];
    }>(gql`
      query groupPhotoCatalogs {
        groupPhotoCatalogs {
          id
          name
          templates {
            catalog {
              id
              name
            }
            description
            displayImg
            id
            name
            positions {
              position
            }
            size {
              width
              height
            }
          }
        }
      }
    `)
  ).groupPhotoCatalogs;
};

export const getGroupPhotoTemplates = async (catalog: string) => {
  return (
    await client.request<{
      groupPhotoTemplates: API.GroupPhotoTemplate[];
    }>(
      gql`
        query groupPhotoTemplates($catalogIds: [String!]) {
          groupPhotoTemplates(catalogIds: $catalogIds) {
            catalog {
              id
              name
            }
            description
            displayImg
            id
            name
            positions {
              position
            }
            size {
              width
              height
            }
          }
        }
      `,
      { catalogIds: [catalog] },
    )
  ).groupPhotoTemplates;
};

export const getGroupPhotoTask = async (id: string) => {
  return (
    await client.request<{
      groupPhotoTask: API.GroupPhotoTask;
    }>(
      gql`
        query groupPhotoTask($id: String!) {
          groupPhotoTask(id: $id) {
            createTime
            creatorId
            hr {
              id
              imageUrls {
                origin
                small
                medium
              }
              progress
              status
            }
            id
            members {
              finetuneId
              finetuneInputImages {
                small
              }
              position
              progress
              status
              userinfo {
                avatarUrl
                id
                username
              }
            }
            reason
            result {
              small
              medium
              origin
            }
            status
            template {
              catalog {
                name
              }
              displayImg
              positionImg
              positions {
                position
              }
            }
          }
        }
      `,
      { id },
    )
  ).groupPhotoTask;
};

export const getGroupPhotoTaskBasic = async (id: string) => {
  return (
    await client.request<{
      groupPhotoTaskBasic: API.GroupPhotoTask;
    }>(
      gql`
        query groupPhotoTaskBasic($id: String!) {
          groupPhotoTaskBasic(id: $id) {
            createTime
            creatorId
            id
            members {
              finetuneId
              finetuneInputImages {
                small
              }
              position
              progress
              status
              userinfo {
                avatarUrl
                id
                username
              }
            }
            reason
            result {
              small
              medium
              origin
            }
            status
            template {
              catalog {
                name
              }
              displayImg
              positionImg
              positions {
                position
              }
            }
          }
        }
      `,
      { id },
    )
  ).groupPhotoTaskBasic;
};

export const getMyGroupPhotoTasks = async (page: number, pageSize: number) => {
  return (
    await client.request<{ myGroupPhotoTasks: API.GroupPhotoTask[] }>(
      gql`
        query myGroupPhotoTasks(
          $page: Float!
          $pageSize: Float!
          $status: [GroupPhotoTaskStatus!]
        ) {
          myGroupPhotoTasks(page: $page, pageSize: $pageSize, status: $status) {
            createTime
            creatorId
            hr {
              id
              imageUrls {
                origin
                small
                medium
              }
              progress
              status
            }
            id
            members {
              finetuneId
              finetuneInputImages {
                small
              }
              position
              progress
              status
              userinfo {
                avatarUrl
                id
                username
              }
            }
            reason
            result {
              small
              medium
              origin
            }
            size {
              width
              height
            }
            status
            template {
              catalog {
                name
              }
              displayImg
              positionImg
              positions {
                position
              }
            }
          }
        }
      `,
      {
        page,
        pageSize,
        status: ['FINISHED', 'PROGRESS', 'FAILED'],
      },
    )
  ).myGroupPhotoTasks;
};
