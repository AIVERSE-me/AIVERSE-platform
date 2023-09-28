import { GraphQLClient } from 'graphql-request';

const API = `/graphql/`;
// const API = `https://aiverse.cc/graphql/`;

let onResponse = (response: any) => {};

export const client = new GraphQLClient(API, {
  responseMiddleware: (response) => {
    onResponse(response);
  },
});

export const setResponseMiddleware = (middleware: (response: any) => void) => {
  onResponse = middleware;
};
