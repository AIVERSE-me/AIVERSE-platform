import { Injectable, NestMiddleware } from '@nestjs/common';
import { TransactionService } from '../service/transaction.service';

@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  constructor(private readonly service: TransactionService) {}
  use(req: any, res: any, next: () => void) {
    this.service.runWithDataSource(() => next());
  }
}
