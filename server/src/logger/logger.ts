import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { LOGGER_ALS, REQUEST_ID_LENGTH } from './request-id';

export class CustomLogger extends ConsoleLogger {
  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ) {
    const output = this.stringifyMessage(message, logLevel);
    pidMessage = this.colorize(pidMessage, logLevel);
    formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
    const reqId =
      LOGGER_ALS.getStore()?.reqId || ''.padStart(REQUEST_ID_LENGTH, '-');
    return `${pidMessage}${this.getTimestamp()} ${formattedLogLevel} [${reqId}] ${contextMessage}${output}${timestampDiff}\n`;
  }
}
