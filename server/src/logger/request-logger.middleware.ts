import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LOGGER_ALS, REQUEST_ID_LENGTH } from './request-id';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  logger: Logger = new Logger(RequestLoggerMiddleware.name);
  reqId = 1;
  use(req: Request, res: Response, next: NextFunction) {
    const reqId = (this.reqId++).toString().padStart(REQUEST_ID_LENGTH, '0');

    const store = {
      reqId,
    };
    LOGGER_ALS.run(store, () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      req._reqId = reqId;
      const { ip, method, originalUrl } = req;
      const userAgent = req.get('user-agent') || '';
      const startTime = new Date();
      this.logger.verbose(`${method} ${originalUrl} - ${userAgent} ${ip}`);

      res.on('finish', () => {
        const { statusCode } = res;
        const contentLength = res.get('content-length');
        const endTime = new Date();
        const delta = (endTime.valueOf() - startTime.valueOf()).toFixed(0);

        this.logger.verbose(
          `${method} ${originalUrl} ${statusCode} ${contentLength} ${delta}ms`,
        );
      });
      next();
    });
  }
}
