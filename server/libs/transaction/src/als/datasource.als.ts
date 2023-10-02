import { AsyncLocalStorage } from 'async_hooks';
import { DataSource } from 'typeorm';

export interface DataSourceState {
  datasource: DataSource;
}

export const DataSourceAls = new AsyncLocalStorage<DataSourceState>();
