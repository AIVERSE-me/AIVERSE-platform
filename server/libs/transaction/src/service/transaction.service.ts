import { Injectable } from '@nestjs/common';

import { DataSource } from 'typeorm';

import { DataSourceAls, DataSourceState } from '../als/datasource.als';

@Injectable()
export class TransactionService {
  constructor(private readonly datasource: DataSource) {}

  async runWithDataSource(func: () => any) {
    if (DataSourceAls.getStore()) {
      return func();
    } else {
      const state: DataSourceState = {
        datasource: this.datasource,
      };

      return await DataSourceAls.run(state, () => func());
    }
  }
}
