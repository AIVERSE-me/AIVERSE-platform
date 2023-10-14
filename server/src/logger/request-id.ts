import { AsyncLocalStorage } from 'async_hooks';

export const LOGGER_ALS = new AsyncLocalStorage<{
  reqId: string;
}>();

export const REQUEST_ID_LENGTH = 7;
